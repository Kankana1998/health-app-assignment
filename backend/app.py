import os
import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from werkzeug.utils import secure_filename
import requests
import base64
import jwt
import json

# App Configuration
app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///health.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev_secret_key')
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__name__)), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize Extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# --- MODELS ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Submission(db.Model):
    __tablename__ = 'submissions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_path = db.Column(db.String(255), nullable=True)
    symptoms = db.Column(db.Text, nullable=True)
    ai_response_json = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Medicine(db.Model):
    __tablename__ = 'medicines'
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submissions.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    dosage = db.Column(db.String(120), nullable=True)
    frequency = db.Column(db.String(120), nullable=True)
    duration = db.Column(db.String(120), nullable=True)
    status = db.Column(db.String(50), default='pending') # pending, taken, skipped

# --- MIDDLEWARE ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except Exception as e:
            return jsonify({'message': 'Token is invalid'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

# --- ROUTES ---
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'User already exists'}), 409
        
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(email=email, password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'message': 'Invalid credentials'}), 401
        
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['JWT_SECRET_KEY'], algorithm="HS256")
    
    return jsonify({'token': token}), 200

@app.route('/api/submissions', methods=['POST'])
@token_required
def create_submission(current_user):
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    
    file = request.files['file']
    symptoms = request.form.get('symptoms', '')

    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{current_user.id}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}")
        file.save(file_path)

        try:
            # Prepare file for REST API
            mime_type = 'application/pdf' if file.filename.lower().endswith('.pdf') else 'image/jpeg'
            if file.filename.lower().endswith('.png'):
                mime_type = 'image/png'
                
            with open(file_path, "rb") as f:
                encoded_file = base64.b64encode(f.read()).decode('utf-8')

            prompt = f"""
            Analyze this prescription and symptoms.
            Symptoms provided by user: {symptoms}
            
            Return ONLY valid JSON with exactly these keys:
            - "medicines": array of objects, each containing "name", "dosage", "frequency", "duration"
            - "dosage_schedule": array of strings
            - "doctor_advice": array of strings
            - "lifestyle_changes": array of strings
            - "disclaimer": string containing "This is not medical advice."
            
            Do not include Markdown formatting like ```json in the output. Just raw JSON.
            """

            api_key = os.environ.get('GEMINI_API_KEY')
            if not api_key:
                return jsonify({'message': 'Gemini API key is missing'}), 500

            headers = {'Content-Type': 'application/json'}
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": encoded_file
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            gemini_res = requests.post(url, headers=headers, json=payload)
            
            if not gemini_res.ok:
                return jsonify({'message': f'AI API Error: {gemini_res.text}'}), 500

            response_data = gemini_res.json()
            response_text = response_data['candidates'][0]['content']['parts'][0]['text'].strip()

            parsed_json = json.loads(response_text)

            new_submission = Submission(
                user_id=current_user.id,
                file_path=file_path,
                symptoms=symptoms,
                ai_response_json=parsed_json
            )
            db.session.add(new_submission)
            db.session.commit()

            # Process medicines for the 'Good-to-Have' feature
            for med in parsed_json.get('medicines', []):
                new_medicine = Medicine(
                    submission_id=new_submission.id,
                    name=med.get('name', 'Unknown'),
                    dosage=med.get('dosage', ''),
                    frequency=med.get('frequency', ''),
                    duration=med.get('duration', '')
                )
                db.session.add(new_medicine)
            db.session.commit()

            return jsonify({
                'message': 'Analysis complete',
                'submission_id': new_submission.id,
                'analysis': parsed_json
            }), 201

        except Exception as e:
            return jsonify({'message': f'AI processing failed: {str(e)}'}), 500

    return jsonify({'message': 'Invalid file type'}), 400

@app.route('/api/submissions', methods=['GET'])
@token_required
def get_submissions(current_user):
    submissions = Submission.query.filter_by(user_id=current_user.id).order_by(Submission.created_at.desc()).all()
    results = []
    for sub in submissions:
        results.append({
            'id': sub.id,
            'symptoms': sub.symptoms,
            'ai_response': sub.ai_response_json,
            'created_at': sub.created_at.isoformat()
        })
    return jsonify(results), 200

@app.route('/api/submissions/<int:submission_id>', methods=['GET'])
@token_required
def get_submission(current_user, submission_id):
    sub = Submission.query.filter_by(id=submission_id, user_id=current_user.id).first()
    if not sub:
        return jsonify({'message': 'Submission not found'}), 404
        
    return jsonify({
        'id': sub.id,
        'symptoms': sub.symptoms,
        'ai_response': sub.ai_response_json,
        'created_at': sub.created_at.isoformat()
    }), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

# Create DB tables on startup
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True, host='0.0.0.0', port=5001)

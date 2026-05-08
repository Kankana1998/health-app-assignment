# Full-Stack AI-Powered Health Companion App

## Overview
This is a full-stack health companion application that allows users to upload their medical prescriptions and symptoms. It leverages Google's Gemini AI to parse the prescription image/PDF and symptoms to return a structured breakdown: prescribed medicines, dosage schedule, doctor's advice, and lifestyle changes.

## Architecture & Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, `shadcn/ui`.
- **Backend**: Python, Flask, SQLAlchemy, Flask-Bcrypt, PyJWT.
- **Database**: PostgreSQL.
- **AI Integration**: Google Gemini 1.5 Flash API.
- **Infrastructure**: Docker, Docker Compose.

### Separation of Concerns
- The **frontend** handles the UI state, routing, and presenting the structured AI data cleanly.
- The **backend** serves as a secure API gateway. It handles user authentication (JWT), file persistence (local Docker volume), prompt engineering/interaction with the Gemini API, and parsing the AI response into PostgreSQL tables.
- **PostgreSQL** is used relationally to store `Users`, `Submissions`, and `Medicines`.

## Features Completed
### Must-Haves (100% Complete)
- [x] User signup/login with hashed passwords and JWT.
- [x] JWT middleware protecting all core API endpoints.
- [x] Upload prescription (Image/PDF) + text symptoms.
- [x] File persistence (stored locally via Docker volume for simplicity/free-tier).
- [x] Gemini API integration with strict system prompting for structured JSON.
- [x] Persistence of the parsed JSON AI output (no LLM recall on reload).
- [x] Clear visible disclaimer that "This is not medical advice."

### Good-to-Haves (Partial)
- [x] Parsed the AI response to explicitly create `Medicine` records in the relational database, setting up the foundation for medicine reminders.

## Local Setup

### 1. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgresql://healthuser:healthpassword@db:5432/healthdb
JWT_SECRET_KEY=supersecretkey123
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Run with Docker Compose
Ensure Docker Desktop is running, then run:
```bash
docker-compose up --build
```
This will start:
- **PostgreSQL Database** on port `5432`
- **Flask Backend** on `http://localhost:5000`
- **Next.js Frontend** on `http://localhost:3000`

The database tables will be created automatically on backend startup. 

## EC2 Deployment Runbook

Follow these steps to deploy this app to a fresh AWS EC2 Free-Tier Instance (Ubuntu).

### Step 1: Provision the EC2 Instance
1. Go to AWS EC2 console, launch a new instance (`t2.micro` or `t3.micro`).
2. Choose **Ubuntu Server 22.04 LTS**.
3. Create/select a Key Pair to SSH into the machine.
4. **Network Settings**: Allow SSH (port 22), HTTP (port 80), and Custom TCP (port 3000, 5000) from anywhere (`0.0.0.0/0`).

### Step 2: Connect to the Instance & Install Docker
SSH into your instance:
```bash
ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>
```
Install Docker and Docker Compose:
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo systemctl start docker
# Add ubuntu user to docker group to run docker without sudo
sudo usermod -aG docker ubuntu
```
*Note: You may need to log out and log back in for the group changes to take effect.*

### Step 3: Clone the Repository & Configure Environment
```bash
git clone <your-repo-url>
cd health-app-assignment
```
Create your `.env` file in the backend directory with your `GEMINI_API_KEY`:
```bash
nano backend/.env
```
Update the `docker-compose.yml` frontend environment variable if needed to point to your public IP instead of localhost (though the Next.js app communicates via the user's browser, so setting `NEXT_PUBLIC_API_URL=http://<your-ec2-public-ip>:5000/api` in `frontend/Dockerfile` or as an ENV is recommended).

### Step 4: Run the Application
```bash
docker-compose up -d --build
```
The application will now be running. You can access the frontend at `http://<your-ec2-public-ip>:3000`.

## Trade-offs & Known Issues
- **File Storage**: I opted for a local Docker volume mount (`./uploads`) instead of S3. This satisfies the assignment constraints without requiring extra AWS configuration or IAM user provisioning, fitting the "simple and well-built" philosophy.
- **Frontend Environment Variables**: In a production setting, `NEXT_PUBLIC_API_URL` should be injected dynamically based on the environment rather than hardcoded in the Dockerfile.
- **Reminders / WebSockets**: I skipped the websocket/cron worker notification system for medicine reminders to ensure the core Upload/Gemini analysis flow was rock-solid and completed well before the deadline. However, the database schema is prepared (`Medicine` table with `status`) to support this feature trivially in the future.

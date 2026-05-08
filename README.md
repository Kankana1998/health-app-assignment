# Health AI Companion

A full-stack, containerized health application that allows users to upload prescriptions and symptoms, utilizing the powerful Gemini AI model to extract structured medical data (medicines, dosage, advice, lifestyle changes).

## 🚀 Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Python, Flask, PyJWT, Bcrypt
- **Database**: PostgreSQL
- **AI Integration**: Google Gemini 2.5 Flash API (Strict JSON formatting)
- **Infrastructure**: Docker, Docker Compose, AWS EC2

---

## 🏗️ Architecture Description
- **Frontend**: Next.js App Router providing a snappy UI, with a `next.config.mjs` proxy routing `/api` requests to the backend container to bypass CORS and simplify EC2 networking.
- **Backend**: Flask API serving as the orchestration layer. Uses PyJWT for stateless authentication and bcrypt for password hashing.
- **AI Engine**: Direct integration with Gemini 2.5 Flash REST API (using strict `application/json` schema enforcement) to parse unstructured prescriptions and symptoms into structured JSON.
- **Database**: PostgreSQL (containerized) handling relational storage of users and AI inference results.
- **Storage**: Local disk/Docker volume for uploaded files, keeping infrastructure lean and within AWS Free Tier limits.

## ✨ Features

### Completed (Must-Haves)
✅ Secure user signup & login with bcrypt & JWT
✅ Protected API endpoints via custom JWT middleware
✅ Upload prescriptions (PDF, PNG, JPG) with free-text symptom notes
✅ File persistence using Docker Volumes
✅ Google Gemini 2.5 Flash AI integration using strict JSON enforcement
✅ Persistent AI structural extraction (medicines, dosage schedule, doctor's advice, lifestyle changes)
✅ Explicit UI disclaimer rendering for medical advice

### Skipped (Good-to-Haves)
❌ Medicine Reminders / Cron Workers (Prioritized core reliability and a polished, bug-free "Must-Have" experience as per the "Partial but well-built" philosophy).

## ⚠️ Known Issues & Trade-offs
- **File Storage**: Using a local Docker volume (`./uploads`) instead of AWS S3. This keeps the application 100% within the free tier and avoids IAM complexity, but it means the server is stateful.
- **Gemini SDK vs REST**: Bypassed the official `google-generativeai` SDK in favor of the raw REST API (`requests`) to ensure maximum compatibility across varying Python environments and avoid `protobuf` conflicts.

---

## 🏃 Local Setup Instructions

1. Clone the repository.
2. Create `backend/.env` with the required variables (see below).
3. Ensure Docker Desktop is running.
4. Run `docker-compose up --build`
5. Open `http://localhost:3000`

## 🔑 Environment Variables
Create a `.env` file inside the `backend` directory:
```bash
# Connection string for the dockerized PostgreSQL database
DATABASE_URL=postgresql://healthuser:healthpassword@db:5432/healthdb

# Secret key for signing JWTs (use any secure random string)
JWT_SECRET_KEY=supersecretkey123

# Gemini API Key (Obtain for free from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here
```

| Setting | Selected Option |
| :--- | :--- |
| **Cloud Provider** | AWS EC2 |
| **Region** | Europe (Stockholm) `eu-north-1` |
| **AMI** | Ubuntu Server 24.04 LTS (HVM), SSD Volume Type |
| **Architecture** | 64-bit (x86) |
| **Instance Type** | `t3.micro` |
| **Free Tier Eligible** | Yes |
| **Virtualization** | HVM |
| **Root Device Type** | EBS |
| **Storage Type** | gp3 SSD |
| **Storage Size** | 8 GiB |

### 2. Key Pair Configuration

| Setting | Selected Option |
| :--- | :--- |
| **Key Pair Type** | RSA |
| **Private Key Format** | `.pem` |
| **Key Pair Usage** | SSH Access |

### 3. Network Configuration

| Setting | Selected Option |
| :--- | :--- |
| **VPC** | Default VPC |
| **Subnet** | No preference |
| **Availability Zone** | No preference |
| **Auto Assign Public IP** | Enabled |

### 4. Security Group Rules (Inbound Rules)

| Type | Protocol | Port | Source |
| :--- | :--- | :--- | :--- |
| SSH | TCP | 22 | `0.0.0.0/0` *(For demo purposes; restrict to your IP in production)* |
| Custom TCP | TCP | 3000 | `0.0.0.0/0` (Frontend) |
| Custom TCP | TCP | 5000 | `0.0.0.0/0` (Backend API) |

### 5. Application Ports

| Service | Port |
| :--- | :--- |
| **Frontend (Next.js)** | 3000 |
| **Backend (Flask API)** | 5000 |
| **PostgreSQL** | 5432 *(Internal Docker network only)* |

---

## 🛠️ Deployment Instructions

### Prerequisites
- Install Docker and Docker Compose on the EC2 instance.
- Clone the repository onto the instance.

```bash
sudo apt update && sudo apt install docker.io docker-compose git -y
git clone https://github.com/Kankana1998/health-app-assignment.git health-app
cd health-app
```

### Environment Variables
Create a `.env` file inside the `backend` directory:
```bash
# Connection string for the dockerized PostgreSQL database
DATABASE_URL=postgresql://healthuser:healthpassword@db:5432/healthdb

# Secret key for signing JWTs (use any secure random string)
JWT_SECRET_KEY=your_secure_random_secret

# Gemini API Key (Obtain for free from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Launching the Application
Since the application is fully containerized, deployment is a single command:
```bash
sudo docker-compose up --build -d
```

Your application will be live at:
- **Frontend**: `http://<EC2_PUBLIC_IP>:3000`
- **Backend API**: `http://<EC2_PUBLIC_IP>:5000`

> **Note**: The Next.js frontend has a built-in proxy in `next.config.mjs` that securely routes `/api/*` traffic directly into the internal Docker network (`http://backend:5000`), completely bypassing CORS issues or hardcoded IP requirements.

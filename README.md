# Health AI Companion

A full-stack, containerized health application that allows users to upload prescriptions and symptoms, utilizing the powerful Gemini AI model to extract structured medical data (medicines, dosage, advice, lifestyle changes).

## 🚀 Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Python, Flask, PyJWT, Bcrypt
- **Database**: PostgreSQL
- **AI Integration**: Google Gemini 2.5 Flash API (Strict JSON formatting)
- **Infrastructure**: Docker, Docker Compose, AWS EC2

---

## 🌩️ AWS EC2 Deployment Configuration

### 1. EC2 Instance Details

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
| SSH | TCP | 22 | `0.0.0.0/0` (Anywhere) |
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
git clone <YOUR_REPO_URL> health-app
cd health-app
```

### Environment Variables
Create a `.env` file inside the `backend` directory:
```bash
DATABASE_URL=postgresql://healthuser:healthpassword@db:5432/healthdb
JWT_SECRET_KEY=supersecretkey123
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

# Backend Setup (Flask + MySQL)

## 1) Create DB
Create a MySQL database (e.g. `campus_volunteer`).

## 2) Configure env
Copy `.env.example` to `.env` and update credentials:

```
SECRET_KEY=change_me
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/campus_volunteer
```

## 3) Install dependencies
```
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 4) Create tables
```
flask --app app.py init-db
```

## 5) Run server
```
python3 app.py
```

Open:
- `http://localhost:5000`

## Sample Data
Login as admin and click "Load Sample Data".

Seeded admin (created on seed):
- email: `admin@campus.edu`
- password: `admin123`

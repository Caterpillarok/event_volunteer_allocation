import os
from datetime import datetime
from functools import wraps

from flask import Flask, jsonify, request, session, send_from_directory
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

from extensions import db


def create_app():
    frontend_dir = os.path.abspath(os.path.join(BASE_DIR, ".."))
    app = Flask(__name__, static_folder=frontend_dir, static_url_path="")
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret_key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:password@localhost:3306/campus_volunteer",
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    from models import User, VolunteerProfile, Event, Application

    def json_error(message, status=400):
        return jsonify({"error": message}), status

    def current_user():
        uid = session.get("user_id")
        if not uid:
            return None
        return User.query.get(uid)

    def login_required(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user:
                return json_error("Unauthorized", 401)
            return fn(*args, **kwargs)

        return wrapper

    def admin_required(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user:
                return json_error("Unauthorized", 401)
            if user.role != "admin":
                return json_error("Forbidden", 403)
            return fn(*args, **kwargs)

        return wrapper

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    @app.get("/")
    def index():
        return send_from_directory(frontend_dir, "index.html")

    @app.get("/<path:path>")
    def static_proxy(path):
        file_path = os.path.join(frontend_dir, path)
        if os.path.isfile(file_path):
            return send_from_directory(frontend_dir, path)
        return json_error("Not found", 404)

    @app.post("/api/register")
    def register():
        data = request.get_json() or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        role = "volunteer"
        skill = (data.get("skill") or "").strip()
        availability = (data.get("availability") or "").strip()

        if not name or not email or not password:
            return json_error("Missing required fields")
        if User.query.filter_by(email=email).first():
            return json_error("Email already registered")

        user = User(
            name=name,
            email=email,
            password_hash=password,
            role=role,
        )
        db.session.add(user)
        db.session.flush()

        if role == "volunteer":
            profile = VolunteerProfile(
                user_id=user.id,
                skill=skill,
                availability=availability,
            )
            db.session.add(profile)

        db.session.commit()
        session["user_id"] = user.id

        return jsonify(user.to_dict())

    @app.post("/api/login")
    def login():
        data = request.get_json() or {}
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        user = User.query.filter_by(email=email).first()
        if not user or user.password_hash != password:
            return json_error("Invalid credentials", 401)
        session["user_id"] = user.id
        return jsonify(user.to_dict())

    @app.post("/api/logout")
    def logout():
        session.pop("user_id", None)
        return jsonify({"status": "ok"})

    @app.get("/api/me")
    def me():
        user = current_user()
        return jsonify(user.to_dict()) if user else jsonify(None)

    @app.get("/api/events")
    def get_events():
        user = current_user()
        events = Event.query.order_by(Event.date.asc()).all()
        payload = []
        for ev in events:
            applicants = len(ev.applications)
            payload.append(
                {
                    **ev.to_dict(),
                    "applicants": applicants,
                    "slots_left": max(0, ev.slots - applicants),
                    "applied": user.id in [a.user_id for a in ev.applications]
                    if user
                    else False,
                }
            )
        return jsonify(payload)

    @app.post("/api/events")
    @admin_required
    def create_event():
        data = request.get_json() or {}
        required = ["name", "date", "venue", "category", "slots", "tagline"]
        if not all(data.get(k) for k in required):
            return json_error("Missing fields")

        status = (data.get("status") or "open").strip().lower()
        if status not in ["open", "closed"]:
            return json_error("Invalid status")
        try:
            event_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return json_error("Invalid date format (YYYY-MM-DD)")

        ev = Event(
            name=data["name"],
            date=event_date,
            venue=data["venue"],
            category=data["category"],
            slots=int(data["slots"]),
            tagline=data["tagline"],
            status=status,
        )
        db.session.add(ev)
        db.session.commit()
        return jsonify(ev.to_dict())

    @app.put("/api/events/<int:event_id>")
    @admin_required
    def update_event(event_id):
        data = request.get_json() or {}
        ev = Event.query.get_or_404(event_id)

        if "name" in data:
            ev.name = data["name"]
        if "date" in data:
            try:
                ev.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
            except ValueError:
                return json_error("Invalid date format (YYYY-MM-DD)")
        if "venue" in data:
            ev.venue = data["venue"]
        if "category" in data:
            ev.category = data["category"]
        if "tagline" in data:
            ev.tagline = data["tagline"]
        if "status" in data:
            status = (data.get("status") or "").strip().lower()
            if status not in ["open", "closed"]:
                return json_error("Invalid status")
            ev.status = status
        if "slots" in data:
            slots = int(data["slots"])
            applicants = len(ev.applications)
            if slots < applicants:
                return json_error("Slots cannot be lower than applicants")
            ev.slots = slots

        db.session.commit()
        return jsonify(ev.to_dict())

    @app.delete("/api/events/<int:event_id>")
    @admin_required
    def delete_event(event_id):
        ev = Event.query.get_or_404(event_id)
        db.session.delete(ev)
        db.session.commit()
        return jsonify({"status": "deleted"})

    @app.get("/api/volunteers")
    @admin_required
    def get_volunteers():
        volunteers = VolunteerProfile.query.all()
        return jsonify([v.to_dict() for v in volunteers])

    @app.put("/api/volunteers/me")
    @login_required
    def update_profile():
        user = current_user()
        if user.role != "volunteer":
            return json_error("Forbidden", 403)
        data = request.get_json() or {}
        profile = user.volunteer_profile
        if not profile:
            profile = VolunteerProfile(user_id=user.id)
            db.session.add(profile)
        if "skill" in data:
            profile.skill = data["skill"]
        if "availability" in data:
            profile.availability = data["availability"]
        db.session.commit()
        return jsonify(profile.to_dict())

    @app.get("/api/applications")
    @login_required
    def my_applications():
        user = current_user()
        apps = Application.query.filter_by(user_id=user.id).all()
        return jsonify([a.to_dict() for a in apps])

    @app.get("/api/applications/all")
    @admin_required
    def all_applications():
        apps = (
            Application.query.join(Event)
            .order_by(Event.date.asc(), Application.created_at.desc())
            .all()
        )
        return jsonify([a.to_dict() for a in apps])

    @app.put("/api/applications/<int:app_id>")
    @admin_required
    def update_application(app_id):
        data = request.get_json() or {}
        status = (data.get("status") or "").strip().lower()
        allowed = {"applied", "approved", "shortlisted", "rejected"}
        if status not in allowed:
            return json_error("Invalid status")
        app_record = Application.query.get_or_404(app_id)
        app_record.status = status
        db.session.commit()
        return jsonify(app_record.to_dict())

    @app.post("/api/applications")
    @login_required
    def apply():
        user = current_user()
        if user.role != "volunteer":
            return json_error("Forbidden", 403)
        data = request.get_json() or {}
        event_id = data.get("event_id")
        phone = (data.get("phone") or "").strip()
        age = data.get("age")
        availability = (data.get("availability") or "").strip()
        motivation = (data.get("motivation") or "").strip()
        experience = (data.get("experience") or "").strip()
        reference_name = (data.get("reference_name") or "").strip()
        reference_contact = (data.get("reference_contact") or "").strip()
        if not event_id:
            return json_error("Missing event_id")
        if not phone or not phone.isdigit() or len(phone) != 10:
            return json_error("Phone must be 10 digits")
        try:
            age = int(age)
        except (TypeError, ValueError):
            return json_error("Age is required")
        if age < 16 or age > 120:
            return json_error("Age must be between 16 and 120")
        if not availability:
            return json_error("Availability is required")
        if not motivation:
            return json_error("Motivation is required")
        if not experience:
            return json_error("Experience is required")
        if len(motivation) > 1000:
            return json_error("Motivation is too long (max 1000 chars)")
        allowed_experience = {"none", "1 year", "2 years", "3+ years"}
        experience_value = experience.lower()
        if experience_value not in allowed_experience:
            return json_error("Invalid experience value")
        if reference_contact:
            ref_digits = "".join(ch for ch in reference_contact if ch.isdigit())
            if len(ref_digits) != 10:
                return json_error("Reference contact must be 10 digits")
            reference_contact = ref_digits
        ev = Event.query.get_or_404(event_id)
        if ev.status != "open":
            return json_error("Event closed")
        if len(ev.applications) >= ev.slots:
            return json_error("Event full")
        if Application.query.filter_by(user_id=user.id, event_id=ev.id).first():
            return json_error("Already applied")

        app_record = Application(
            user_id=user.id,
            event_id=ev.id,
            phone=phone,
            age=age,
            availability=availability,
            motivation=motivation,
            experience=experience_value,
            reference_name=reference_name,
            reference_contact=reference_contact,
        )
        db.session.add(app_record)
        db.session.commit()
        return jsonify(app_record.to_dict())

    @app.delete("/api/applications/<int:app_id>")
    @login_required
    def cancel_application(app_id):
        user = current_user()
        if user.role != "volunteer":
            return json_error("Forbidden", 403)
        app_record = Application.query.get_or_404(app_id)
        if app_record.user_id != user.id:
            return json_error("Forbidden", 403)
        db.session.delete(app_record)
        db.session.commit()
        return jsonify({"status": "deleted"})

    @app.post("/api/seed")
    @admin_required
    def seed():
        if Event.query.count() == 0:
            samples = [
                Event(
                    name="Freshers Welcome Expo",
                    date=datetime.strptime("2026-03-12", "%Y-%m-%d").date(),
                    venue="Student Center Hall",
                    category="community",
                    slots=18,
                    tagline="Welcome new students with guided tours and info desks.",
                ),
                Event(
                    name="Spring Arts Night",
                    date=datetime.strptime("2026-03-20", "%Y-%m-%d").date(),
                    venue="Fine Arts Gallery",
                    category="arts",
                    slots=12,
                    tagline="Support performers, run stage cues, and capture highlights.",
                ),
                Event(
                    name="Campus 5K Run",
                    date=datetime.strptime("2026-03-27", "%Y-%m-%d").date(),
                    venue="North Track",
                    category="sports",
                    slots=20,
                    tagline="Manage check-in and hydration stations for runners.",
                ),
            ]
            db.session.add_all(samples)

        if User.query.filter_by(email="admin@campus.edu").first() is None:
            admin = User(
                name="Campus Admin",
                email="admin@campus.edu",
                password_hash="admin123",
                role="admin",
            )
            db.session.add(admin)

        db.session.commit()
        return jsonify({"status": "seeded"})

    @app.cli.command("init-db")
    def init_db_command():
        with app.app_context():
            db.create_all()
            print("Database tables created")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=False, use_reloader=False)

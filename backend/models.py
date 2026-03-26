from datetime import datetime

from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="volunteer")

    volunteer_profile = db.relationship(
        "VolunteerProfile", back_populates="user", uselist=False
    )
    applications = db.relationship("Application", back_populates="user")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
        }


class VolunteerProfile(db.Model):
    __tablename__ = "volunteer_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True
    )
    skill = db.Column(db.String(120), default="")
    availability = db.Column(db.String(120), default="")

    user = db.relationship("User", back_populates="volunteer_profile")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.user.name if self.user else "",
            "email": self.user.email if self.user else "",
            "skill": self.skill,
            "availability": self.availability,
        }


class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False)
    venue = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    slots = db.Column(db.Integer, nullable=False, default=0)
    tagline = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="open")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    applications = db.relationship("Application", back_populates="event", cascade="all, delete")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "date": self.date.isoformat() if self.date else "",
            "venue": self.venue,
            "category": self.category,
            "slots": self.slots,
            "tagline": self.tagline,
            "status": self.status,
        }


class Application(db.Model):
    __tablename__ = "applications"
    __table_args__ = (
        db.UniqueConstraint("user_id", "event_id", name="uq_user_event"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    phone = db.Column(db.String(20), nullable=True, default="")
    age = db.Column(db.Integer, nullable=True)
    availability = db.Column(db.String(120), nullable=True, default="")
    motivation = db.Column(db.Text, nullable=True, default="")
    experience = db.Column(db.String(50), nullable=True, default="")
    reference_name = db.Column(db.String(120), nullable=True, default="")
    reference_contact = db.Column(db.String(120), nullable=True, default="")
    status = db.Column(db.String(50), default="applied")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="applications")
    event = db.relationship("Event", back_populates="applications")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else "",
            "user_email": self.user.email if self.user else "",
            "event_id": self.event_id,
            "event_name": self.event.name if self.event else "",
            "phone": self.phone or "",
            "age": self.age,
            "availability": self.availability or "",
            "motivation": self.motivation or "",
            "experience": self.experience or "",
            "reference_name": self.reference_name or "",
            "reference_contact": self.reference_contact or "",
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }

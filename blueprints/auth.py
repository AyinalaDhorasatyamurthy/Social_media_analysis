from flask import Blueprint, request, jsonify, current_app
from pymongo import MongoClient
import jwt
import datetime
import random
import re
import os
from flask_mail import Message
from blueprints.config import MONGODB_URI, MONGODB_DB, JWT_SECRET_KEY, FROM_EMAIL, EMAIL_PASSWORD

auth = Blueprint('auth', __name__)

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB]
users_col = db['users']
auth_logs_col = db['auth_logs']
otp_col = db['otp_codes']

SECRET_KEY = JWT_SECRET_KEY or "insightsphere-super-secure-key-2026"

def generate_otp():
    """Generate a secure 6-digit numeric OTP"""
    return f"{random.randint(100000, 999999)}"

@auth.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@auth.route('/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.get_json(force=True, silent=True) or {}
        email = (data.get('email') or '').strip().lower()
        name = (data.get('name') or '').strip()

        if not email or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            return jsonify({"error": "Please enter a valid email address (e.g. yourname@gmail.com)."}), 400

        # Check typo domains
        domain = email.split('@')[-1]
        typo_map = {
            "gmial.com": "gmail.com",
            "gmai.com": "gmail.com",
            "gamil.com": "gmail.com",
            "gmaill.com": "gmail.com",
            "yaho.com": "yahoo.com",
            "hotmial.com": "hotmail.com"
        }
        if domain in typo_map:
            suggested = typo_map[domain]
            return jsonify({
                "error": f"The domain '@{domain}' looks like a typo for '@{suggested}'. Please check and use '@{suggested}'."
            }), 400

        otp = generate_otp()
        now = datetime.datetime.utcnow()
        expires_at = now + datetime.timedelta(minutes=10)

        # Record OTP in MongoDB
        otp_col.update_one(
            {"email": email},
            {"$set": {
                "email": email,
                "name": name,
                "otp": otp,
                "created_at": now,
                "expires_at": expires_at,
                "verified": False,
                "attempts": 0
            }},
            upsert=True
        )

        # Log OTP Request Event in MongoDB
        auth_logs_col.insert_one({
            "action": "OTP_GENERATED",
            "email": email,
            "ip": request.remote_addr,
            "timestamp": now.isoformat()
        })

        # Send Real Email via Direct smtplib (with Flask-Mail fallback)
        mail_sent = False
        mail_error = None
        from_email_val = os.getenv("FROM_EMAIL") or current_app.config.get("MAIL_USERNAME") or FROM_EMAIL
        email_password_val = os.getenv("EMAIL_PASSWORD") or current_app.config.get("MAIL_PASSWORD") or EMAIL_PASSWORD

        if from_email_val and email_password_val:
            plain_body = f"Your InsightSphere 6-digit verification code is: {otp}\n\nThis code is valid for 10 minutes.\nIf you did not request this code, you can safely ignore this email."
            html_body = f"""
            <div style="font-family: 'Roboto', 'Segoe UI', Arial, sans-serif; background-color: #0f0f0f; color: #ffffff; padding: 40px 20px; max-width: 580px; margin: 0 auto; border-radius: 12px; border: 1px solid #272727;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px; border-bottom: 1px solid #272727; padding-bottom: 16px;">
                    <span style="background: #FF0000; color: #ffffff; font-weight: 900; font-size: 14px; padding: 4px 10px; border-radius: 6px;">▶ InsightSphere</span>
                    <span style="color: #aaaaaa; font-size: 12px; font-weight: 700; letter-spacing: 0.08em;">STUDIO SECURITY</span>
                </div>
                <h2 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 12px 0;">Authentication Verification Code</h2>
                <p style="color: #aaaaaa; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                    Hello {name or 'Creator'},<br/>
                    Use the secure 6-digit one-time password below to authenticate and access your InsightSphere creator workspace.
                </p>
                <div style="background: #181818; border: 1px solid #272727; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #aaaaaa; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 8px;">Your One-Time Code</div>
                    <div style="font-family: monospace; font-size: 34px; font-weight: 900; color: #FF0000; letter-spacing: 8px;">{otp}</div>
                    <div style="font-size: 11px; color: #717171; margin-top: 8px;">Valid for 10 minutes &bull; Do not share this code with anyone</div>
                </div>
                <p style="color: #717171; font-size: 12px; line-height: 1.5; margin: 0;">
                    If you did not request this verification code, you can safely ignore this email.
                </p>
            </div>
            """

            # 1. Try Direct smtplib
            try:
                import smtplib
                from email.mime.multipart import MIMEMultipart
                from email.mime.text import MIMEText

                msg = MIMEMultipart("alternative")
                msg["Subject"] = f"Your InsightSphere Security Verification Code: {otp}"
                msg["From"] = f"InsightSphere Security <{from_email_val}>"
                msg["To"] = email
                msg["X-Priority"] = "1"
                msg["Importance"] = "High"

                msg.attach(MIMEText(plain_body, "plain"))
                msg.attach(MIMEText(html_body, "html"))

                server = smtplib.SMTP("smtp.gmail.com", 587, timeout=12)
                server.starttls()
                server.login(from_email_val, email_password_val)
                server.sendmail(from_email_val, [email], msg.as_string())
                server.quit()
                mail_sent = True
                print(f"[AUTH OTP DISPATCH] Successfully delivered real email OTP {otp} to {email}")
            except Exception as e:
                mail_error = str(e)
                print(f"[AUTH ERROR] Direct smtplib failed: {e}. Trying Flask-Mail fallback...")
                if "mail" in current_app.extensions:
                    try:
                        fmsg = Message(
                            subject=f"Your InsightSphere Security Verification Code: {otp}",
                            sender=("InsightSphere Security", from_email_val),
                            recipients=[email]
                        )
                        fmsg.html = html_body
                        fmsg.body = plain_body
                        current_app.extensions["mail"].send(fmsg)
                        mail_sent = True
                        print(f"[AUTH OTP DISPATCH] Flask-Mail delivered real email OTP {otp} to {email}")
                    except Exception as fe:
                        print(f"[AUTH ERROR] Flask-Mail also failed: {fe}")

        return jsonify({
            "status": "success",
            "message": f"Verification code sent to {email}! Please check your Inbox and Spam/Junk folder." if mail_sent else f"Verification code sent to {email}.",
            "email": email,
            "mail_sent": mail_sent
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to issue OTP: {str(e)}"}), 500

@auth.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.get_json(force=True, silent=True) or {}
        email = (data.get('email') or '').strip().lower()
        user_otp = (data.get('otp') or '').strip()
        name = (data.get('name') or '').strip()
        role = (data.get('role') or '').strip()
        bio = (data.get('bio') or '').strip()

        if not email or not user_otp:
            return jsonify({"error": "Both email and 6-digit OTP are required."}), 400

        # Look up OTP record
        record = otp_col.find_one({"email": email})
        now = datetime.datetime.utcnow()

        if not record:
            return jsonify({"error": "No pending OTP found for this email. Please click 'Send OTP' first."}), 404

        if record.get("expires_at") and now > record["expires_at"]:
            return jsonify({"error": "This OTP has expired. Please request a new one."}), 400

        if str(record.get("otp")).strip() != user_otp:
            otp_col.update_one({"email": email}, {"$inc": {"attempts": 1}})
            auth_logs_col.insert_one({
                "action": "OTP_VERIFICATION_FAILED",
                "email": email,
                "entered_otp": user_otp,
                "ip": request.remote_addr,
                "timestamp": now.isoformat()
            })
            return jsonify({"error": "Incorrect verification code. Please check your OTP and try again."}), 400

        # Mark OTP as verified
        otp_col.update_one({"email": email}, {"$set": {"verified": True}})

        # Upsert User in MongoDB 'users' Collection
        existing_user = users_col.find_one({"email": email})
        display_name = name or (existing_user.get("name") if existing_user else "") or email.split("@")[0].title()
        user_role = role or (existing_user.get("role") if existing_user else "") or "Creator Intelligence Analyst"
        user_bio = bio or (existing_user.get("bio") if existing_user else "") or "InsightSphere Studio Member"
        avatar_url = (existing_user.get("avatar") if existing_user else "") or f"https://api.dicebear.com/7.x/identicon/svg?seed={email}"

        now_str = now.isoformat()
        if existing_user:
            users_col.update_one(
                {"email": email},
                {"$set": {
                    "last_login": now_str,
                    "name": display_name,
                    "role": user_role,
                    "bio": user_bio,
                    "avatar": avatar_url
                }, "$inc": {"login_count": 1}}
            )
            user_id = str(existing_user["_id"])
            created_at = existing_user.get("created_at", now_str)
            login_count = existing_user.get("login_count", 0) + 1
            log_action = "USER_LOGIN_SUCCESSFUL"
        else:
            new_user = {
                "email": email,
                "name": display_name,
                "role": user_role,
                "bio": user_bio,
                "avatar": avatar_url,
                "created_at": now_str,
                "last_login": now_str,
                "login_count": 1
            }
            res = users_col.insert_one(new_user)
            user_id = str(res.inserted_id)
            created_at = now_str
            login_count = 1
            log_action = "USER_SIGNUP_AND_PROFILE_CREATED"

        # Record Authentication Log in MongoDB 'auth_logs'
        auth_logs_col.insert_one({
            "action": log_action,
            "email": email,
            "user_id": user_id,
            "name": display_name,
            "ip": request.remote_addr,
            "timestamp": now_str
        })

        # Generate JWT Token
        token = jwt.encode({
            "email": email,
            "user_id": user_id,
            "exp": now + datetime.timedelta(days=14)
        }, SECRET_KEY, algorithm="HS256")

        user_profile = {
            "id": user_id,
            "email": email,
            "name": display_name,
            "role": user_role,
            "bio": user_bio,
            "avatar": avatar_url,
            "created_at": created_at,
            "last_login": now_str,
            "login_count": login_count
        }

        return jsonify({
            "status": "success",
            "message": f"Welcome back, {display_name}! Successfully logged into InsightSphere.",
            "token": token,
            "user": user_profile
        }), 200

    except Exception as e:
        return jsonify({"error": f"Verification error: {str(e)}"}), 500

@auth.route('/profile', methods=['GET'])
def get_profile():
    try:
        email = (request.args.get('email') or '').strip().lower()
        if not email:
            return jsonify({"error": "Email is required to fetch profile."}), 400

        user = users_col.find_one({"email": email})
        if not user:
            return jsonify({"error": "User profile not found."}), 404

        return jsonify({
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user.get("role", "Creator Intelligence Analyst"),
            "bio": user.get("bio", ""),
            "avatar": user.get("avatar", ""),
            "created_at": user.get("created_at", ""),
            "last_login": user.get("last_login", ""),
            "login_count": user.get("login_count", 1)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth.route('/update-profile', methods=['POST'])
def update_profile():
    try:
        data = request.get_json(force=True, silent=True) or {}
        email = (data.get('email') or '').strip().lower()
        name = (data.get('name') or '').strip()
        role = (data.get('role') or '').strip()
        bio = (data.get('bio') or '').strip()

        if not email:
            return jsonify({"error": "Email is required."}), 400

        update_fields = {}
        if name: update_fields["name"] = name
        if role: update_fields["role"] = role
        if bio: update_fields["bio"] = bio

        users_col.update_one({"email": email}, {"$set": update_fields})

        auth_logs_col.insert_one({
            "action": "PROFILE_UPDATED",
            "email": email,
            "updated_fields": list(update_fields.keys()),
            "timestamp": datetime.datetime.utcnow().isoformat()
        })

        user = users_col.find_one({"email": email})
        return jsonify({
            "status": "success",
            "message": "Profile successfully updated in MongoDB.",
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name"),
                "role": user.get("role"),
                "bio": user.get("bio"),
                "avatar": user.get("avatar"),
                "last_login": user.get("last_login")
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth.route('/auth-status', methods=['GET'])
def auth_status():
    try:
        user_count = users_col.count_documents({})
        logs_count = auth_logs_col.count_documents({})
        recent_logins = list(auth_logs_col.find().sort("timestamp", -1).limit(5))
        for r in recent_logins:
            r["_id"] = str(r["_id"])
        return jsonify({
            "status": "active",
            "registered_users": user_count,
            "total_auth_events": logs_count,
            "recent_events": recent_logins
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

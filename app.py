import os
import joblib
import pandas as pd
from flask import Flask, render_template, request, jsonify

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, 'templates'),
    static_folder=os.path.join(BASE_DIR, 'static')
)

# Load the trained model pipeline
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'Mental_Health_Model.pkl')
model = None

try:
    model = joblib.load(MODEL_PATH)
    print("Mental Health ML Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")

TOP_COUNTRIES = ['India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Turkey', 'Mexico', 'France']

def map_country(country):
    if not country:
        return 'Other'
    country_clean = country.strip()
    if country_clean in TOP_COUNTRIES:
        return country_clean
    return 'Other'

def calculate_insights(user_data, predicted_score):
    score = round(float(predicted_score), 2)
    
    # Mental Health Level Categorization
    if score >= 7.5:
        category = "Optimal Well-being"
        status_color = "#10B981" # Emerald Green
        badge_text = "Low Risk / Healthy Balance"
        summary = "Your responses suggest a well-balanced lifestyle with healthy digital habits and good stress management."
    elif score >= 6.0:
        category = "Moderate Well-being"
        status_color = "#F59E0B" # Amber Yellow
        badge_text = "Moderate Fatigue Risk"
        summary = "You maintain a decent baseline, but elevated screen time or stress levels may be causing periodic mental exhaustion."
    elif score >= 4.5:
        category = "Elevated Mental Stress"
        status_color = "#F97316" # Warm Orange
        badge_text = "High Stress Alert"
        summary = "Your digital usage and study/work burden appear to be taking a noticeable toll on your energy and sleep quality."
    else:
        category = "Severe Burnout Risk"
        status_color = "#EF4444" # Rose Red
        badge_text = "Urgent Lifestyle Reset Needed"
        summary = "High digital locks, poor sleep, and excessive stress indicate a critical risk of burnout and mental exhaustion."

    tips = []
    
    # Screen time tip
    usage_hours = float(user_data.get('Avg_Daily_Usage_Hours', 0))
    if usage_hours >= 6:
        tips.append({
            "icon": "fa-mobile-screen-button",
            "title": "High Daily Screen Time",
            "desc": f"You spend approx {usage_hours} hrs/day on social media. Try setting daily app limits to reduce cognitive fatigue."
        })
    elif usage_hours <= 2.5:
        tips.append({
            "icon": "fa-check-circle",
            "title": "Balanced Digital Consumption",
            "desc": "Great job! Keeping social media usage under 3 hours helps preserve focus and mood stability."
        })

    # Phone Unlocks tip
    unlocks = int(user_data.get('Daily_Unlocks', 0))
    if unlocks >= 150:
        tips.append({
            "icon": "fa-bell-slash",
            "title": "Frequent Phone Checking",
            "desc": f"{unlocks} daily unlocks indicate high subconscious distraction. Turn off non-essential notifications."
        })

    # Sleep tip
    sleep = float(user_data.get('Sleep_Hours_Per_Night', 0))
    if sleep < 6.5:
        tips.append({
            "icon": "fa-bed",
            "title": "Sleep Deprivation Risk",
            "desc": f"Getting only {sleep} hrs of sleep hinders emotional resilience. Aim for 7–8 hours of consistent restful sleep."
        })
    elif sleep >= 7.5:
        tips.append({
            "icon": "fa-moon",
            "title": "Optimal Sleep Schedule",
            "desc": f"Your sleep routine ({sleep} hrs) provides a strong foundation for mental recovery."
        })

    # Physical Activity tip
    activity = float(user_data.get('Physical_Activity_Hours', 0))
    if activity < 1.0:
        tips.append({
            "icon": "fa-person-walking",
            "title": "Sedentary Routine",
            "desc": "Low physical activity increases anxiety and brain fog. Try a 20-minute daily walk or light stretching."
        })

    # Stress tip
    stress = str(user_data.get('Stress_Level', 'Medium'))
    if stress in ['High', 'Very High']:
        tips.append({
            "icon": "fa-heart-pulse",
            "title": "Stress Management Required",
            "desc": f"Self-reported stress is '{stress}'. Practice 5-minute deep breathing or mindfulness techniques daily."
        })

    if not tips:
        tips.append({
            "icon": "fa-award",
            "title": "Keep Up the Good Habits",
            "desc": "Continue maintaining a healthy balance between study, exercise, and digital leisure."
        })

    # Indicator meters (0 to 100)
    sleep_score = min(100, max(10, int((sleep / 8.0) * 100)))
    digital_balance = min(100, max(10, int((1 - min(usage_hours, 12) / 12.0) * 100)))
    activity_score = min(100, max(10, int((activity / 2.5) * 100)))
    
    stress_map = {'Low': 90, 'Medium': 65, 'High': 35, 'Very High': 15}
    stress_balance = stress_map.get(stress, 50)

    return {
        "score": score,
        "category": category,
        "status_color": status_color,
        "badge_text": badge_text,
        "summary": summary,
        "tips": tips,
        "sub_scores": {
            "sleep_health": sleep_score,
            "digital_detox": digital_balance,
            "physical_vitality": activity_score,
            "stress_resilience": stress_balance
        }
    }

@app.route('/')
@app.route('/api/index')
def index():
    return render_template('index.html')

@app.route('/api/options', methods=['GET'])
@app.route('/api/index/api/options', methods=['GET'])
def get_options():
    return jsonify({
        "countries": ['India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Turkey', 'Mexico', 'France', 'Other'],
        "genders": ['Male', 'Female', 'Other'],
        "academic_levels": ['High School', 'Undergraduate', 'Graduate', 'Doctorate', 'Other'],
        "platforms": ['Instagram', 'YouTube', 'Facebook', 'LinkedIn', 'Snapchat', 'TikTok', 'Twitter / X', 'WeChat', 'Other'],
        "purposes": ['Entertainment', 'Education', 'Networking', 'Gaming', 'Work / Business', 'Other'],
        "stress_levels": ['Low', 'Medium', 'High', 'Very High']
    })

@app.route('/api/predict', methods=['POST'])
@app.route('/api/index/api/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "ML Model is not loaded properly on the server."}), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input payload received."}), 400

        user_name = data.get('name', 'Friend').strip() or 'Friend'
        raw_country = data.get('Country', 'Other')
        grouped_country = map_country(raw_country)

        # Construct dataframe matching exact trained pipeline feature columns
        # Features order: Study_Hours, Age, Avg_Daily_Usage_Hours, Daily_Unlocks,
        # Physical_Activity_Hours, Sleep_Hours_Per_Night, Stress_Level, Gender,
        # Academic_Level, Most_Used_Platform, Purpose_Of_Use, Grouped_country
        input_df = pd.DataFrame([{
            'Study_Hours': float(data.get('Study_Hours', 3.0)),
            'Age': int(data.get('Age', 20)),
            'Avg_Daily_Usage_Hours': float(data.get('Avg_Daily_Usage_Hours', 4.0)),
            'Daily_Unlocks': int(data.get('Daily_Unlocks', 100)),
            'Physical_Activity_Hours': float(data.get('Physical_Activity_Hours', 1.5)),
            'Sleep_Hours_Per_Night': float(data.get('Sleep_Hours_Per_Night', 7.0)),
            'Stress_Level': str(data.get('Stress_Level', 'Medium')),
            'Gender': str(data.get('Gender', 'Male')),
            'Academic_Level': str(data.get('Academic_Level', 'Undergraduate')),
            'Most_Used_Platform': str(data.get('Most_Used_Platform', 'Instagram')),
            'Purpose_Of_Use': str(data.get('Purpose_Of_Use', 'Entertainment')),
            'Grouped_country': grouped_country
        }])

        raw_pred = model.predict(input_df)[0]
        # Ensure score stays in a clean realistic 1.0 - 10.0 range
        predicted_score = max(1.0, min(10.0, float(raw_pred)))
        
        insights = calculate_insights(data, predicted_score)
        insights['user_name'] = user_name

        model_name = os.path.basename(MODEL_PATH)
        if hasattr(model, 'steps'):
            model_type = f"{type(model.steps[-1][1]).__name__}"
        else:
            model_type = type(model).__name__

        return jsonify({
            "success": True,
            "data": insights,
            "model_name": model_name,
            "model_type": model_type
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": f"Failed to calculate mental health score: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)

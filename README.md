# Test Sample CSV Files

This folder contains demo CSV files for testing the Heart Disease Prediction model.

## Files

### 1. **high_risk_patient.csv**
Single patient with high-risk indicators:
- 65-year-old male
- Asymptomatic chest pain (type 4)
- High BP (145) and cholesterol (350)
- Exercise-induced angina
- Expected: **Presence**

### 2. **low_risk_patient.csv**
Single healthy young patient:
- 35-year-old female
- Typical angina (type 1)
- Normal BP (115) and cholesterol (200)
- No exercise angina
- Expected: **Absence**

### 3. **mixed_batch.csv**
5 patients with varying risk profiles:
- 3 high-risk cases (expected Presence)
- 2 low-risk cases (expected Absence)

### 4. **elderly_high_risk.csv**
3 elderly patients (70+) with multiple risk factors:
- All have asymptomatic/atypical chest pain
- High BP and cholesterol
- Exercise-induced angina
- Expected: **Presence** for all

### 5. **young_healthy.csv**
4 young patients (28-40) with healthy profiles:
- Normal vital signs
- No exercise angina
- Low cholesterol
- Expected: **Absence** for all

### 6. **moderate_risk.csv**
4 middle-aged patients (48-55) with mixed indicators:
- Some risk factors present
- Mix of Presence and Absence expected

## How to Use

1. Open `index.html` in your browser
2. Scroll to "Optional: Upload heart.csv to compute dataset averages"
3. Click "Choose File" and select any test CSV
4. Click "Analyze CSV" to see statistics
5. Manually enter values from the CSV into the form to test predictions

## Manual Testing

For each patient in the CSV, you can:
1. Copy their values
2. Fill the prediction form
3. Click "Predict"
4. Compare result with the "Heart Disease" column in the CSV

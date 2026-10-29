# 1. Base Image: Explicitly use linux/amd64 architecture
# This ensures precompiled wheels (mediapipe, tensorflow) install seamlessly
FROM --platform=linux/amd64 python:3.9-slim

# 2. Prevent Python from buffering logs (so logs show up immediately in cloud dashboards)
#    and set cache dirs to writable temp paths
ENV PYTHONUNBUFFERED=1 \
    MPLCONFIGDIR=/tmp/matplotlib \
    KERAS_HOME=/tmp/keras

# 3. Install Linux system libraries required by OpenCV and MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 4. Set the working directory inside the container
WORKDIR /app

# 5. Copy requirements FIRST (Docker Layer Caching!)
COPY requirements.txt .

# 6. Upgrade pip and install Python dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 7. Copy the rest of the project code into the container
COPY . .

# 8. Document that the container listens on port 8000
EXPOSE 8000

# 9. Start the server when the container launches!
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]

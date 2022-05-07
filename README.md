# About
This project is about supporting transcription and categorisation of loose audio files 

# Making it working
Technically, it works, but it's in development and it's unknown how long I will maintain it

This app uses SQLite database and to setup it you have to:
- Run api.py
- Through curl of cmd make POST request to setup_database endpoint
-   curl http://localhost:5002/setup_database -X POST

Files must be in source directory

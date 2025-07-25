from flask import render_template, redirect, url_for, session
from . import main

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/qr')
def qr_section():
    if not session.get('user_authenticated'):
        return redirect(url_for('auth.login'))
    return render_template('qr_section.html') 
# Barangay Culiat, Quezon City Traffic Command

Master Prompt

Role

You are a Senior Software Architect, Senior UI/UX Designer, and Full-Stack Engineer with 15+ years of experience building enterprise government systems.

Design and develop a Modern Enterprise Traffic Enforcement Management System for the Barangay Culiat, Quezon City Local Government Unit (LGU).

The system must have a premium government enterprise dashboard comparable to products from Microsoft, Stripe Dashboard, Linear, Notion, Vercel, and IBM.

The UI must be clean, modern, responsive, animated, highly interactive, and optimized for desktop, tablet, and mobile devices.

Capstone Title:
DEVELOPMENT AND IMPLEMENTATION OF A WEB-BASED TRAFFIC ENFORCEMENT SYSTEM USING AI AND IOT FOR REAL-TIME TRAFFIC VIOLATION DETECTION, CAMERA TRACKING, DIGITAL CITATION, ONLINE PAYMENT, AND EMAIL NOTIFICATION FOR THE BARANGAY CULIAT QUEZON CITY LGU

Objective

Develop a complete smart traffic management platform capable of

AI Traffic Violation Detection

IoT Camera Monitoring

License Plate Recognition

Real-time Camera Tracking

Vehicle Registration

Digital Ticketing

Online Payment

Email Notification

Traffic Analytics

GIS Monitoring

Citizen Portal

Enforcement Dashboard

Complete Audit Trail

Tech Stack

Frontend

React 19

TypeScript

TailwindCSS

React Router

React Hook Form

TanStack Query

Zustand

Framer Motion

Shadcn UI

Radix UI

Recharts

React Table

React Leaflet

React Webcam

Lucide Icons

Backend

Node.js

Express.js

TypeScript

Database

Supabase PostgreSQL

Authentication

Supabase Auth

JWT

Refresh Token

Storage

Supabase Storage

Realtime

Supabase Realtime

AI

TensorFlow.js

OpenCV

YOLOv11

OCR License Plate Recognition

IoT

ESP32 Cameras

CCTV Cameras

IP Cameras

MQTT

WebSocket

Payment Gateway

PayMongo

GCash

Maya

Credit Card

Notification

Email Notification

SMS Ready

Push Notification

Maps

Google Maps API

OpenStreetMap

Charts

Recharts

Deployment

Frontend

Vercel

Backend

Railway

Database

Supabase

UI Design Requirements

Create a premium enterprise government dashboard.

Design inspiration

Stripe Dashboard

Vercel

IBM Carbon

Microsoft Fluent

Apple Dashboard

Notion

Arc Browser

Figma

Design Style

Modern

Minimal

Professional

Government Standard

Enterprise Grade

Glassmorphism

Soft Shadows

Rounded Cards

Gradient Accents

Micro Animations

Responsive

Dark Mode

Light Mode

Accessible

WCAG AA

Color Palette

Primary

Blue

Indigo

Sky Blue

Secondary

White

Light Gray

Dark Slate

Accent

Emerald

Orange

Red

Typography

Inter

Poppins

Space Grotesk

Animation

Framer Motion

Smooth page transition

Loading Skeleton

Hover Animation

Card Elevation

Animated Charts

Animated Counters

Animated Sidebar

Animated Notifications

Progress Indicators

Floating Buttons

Layout

Responsive Sidebar

Top Navigation

Search Bar

Notification Center

Profile Menu

Quick Actions

Statistics Cards

Charts

Tables

Maps

AI Alerts

Camera Monitoring

Modules

1 Dashboard

Real-time KPIs

Today's Violations

Active Officers

Traffic Density

Revenue

Pending Payments

Recent Activities

AI Alerts

Weather Widget

Live Cameras

Traffic Heatmap

2 Traffic Violation Recording Module

Officer Records Violation

Photo Upload

Video Upload

GPS

Violation Category

Timestamp

AI Validation

Generate Digital Citation

Officer Signature

Citizen Signature

Evidence Gallery

3 Vehicle Monitoring and Registration Module

Vehicle Database

License Plate

Owner

Registration

Insurance

Color

Vehicle Type

Violation History

Blacklist

Vehicle Search

OCR Search

4 AI Violation Detection

YOLO Detection

Helmet Detection

Seatbelt Detection

Wrong Lane

Overspeeding

Illegal Parking

No Helmet

Running Red Light

Counterflow

Triple Riding

License Plate Recognition

AI Confidence Score

Manual Verification

5 IoT Camera Tracking

Live Cameras

Camera Status

Offline Detection

GPS Camera

Streaming

Snapshots

Recording

AI Detection Overlay

Camera Health

6 Traffic Flow Monitoring

Traffic Density

Vehicle Count

Heatmap

Congestion

Peak Hours

Historical Trends

Road Analytics

Average Speed

7 Public Transport Coordination

Routes

Bus Monitoring

Jeepney Monitoring

Terminal Monitoring

Route Congestion

Driver Records

8 Citation and Penalty Management

Digital Citation

Violation History

Penalty

Discount

Appeal

Court Schedule

Receipt

Invoice

PDF Generation

QR Code

Barcode

9 Online Payment

GCash

Maya

Card

Reference Number

Receipt

Payment History

Refund

Payment Status

10 Citizen Portal

Register

View Violations

Pay Online

Download Receipt

Appeal Citation

Track Status

Notification Center

Profile

Vehicle Registration

11 Officer Portal

Assigned Area

Camera Feed

Issue Citation

AI Recommendation

Daily Report

Performance

Shift

GPS Tracking

12 Reports

Daily

Weekly

Monthly

Yearly

Violation Report

Revenue Report

Officer Performance

Traffic Analytics

Heatmaps

PDF

Excel

CSV

13 Email Notification

Citation Issued

Payment Reminder

Payment Success

Appeal Status

Registration Expiration

14 Analytics Dashboard

Violation Trends

Traffic Density

Revenue

Top Violations

Top Roads

Officer Productivity

AI Accuracy

Payment Collection

Charts

KPIs

Forecast

User Roles (RBAC)

Implement Enterprise Role-Based Access Control (RBAC) with permission-based authorization.

Super Administrator

Full System Access

Manage Everything

Configure AI

Configure Cameras

Manage Users

Manage Roles

System Settings

Database Backup

Audit Logs

Analytics

System Administrator

Manage Users

Manage Officers

Manage Cameras

Manage Traffic Rules

Manage Vehicles

Reports

Notifications

Settings

Traffic Administrator

Traffic Monitoring

Assign Officers

Monitor Cameras

Generate Reports

Approve Appeals

Manage Violations

Traffic Enforcement Officer

Record Violations

View Assigned Cameras

Issue Citation

Upload Evidence

Verify AI Detection

GPS Tracking

Daily Reports

Traffic Supervisor

Monitor Officers

Approve Citations

Review AI Decisions

Assign Tasks

View Analytics

Cashier / Finance Officer

Payment Verification

Refunds

Invoices

Revenue Reports

Receipts

Vehicle Registration Officer

Vehicle Registration

Vehicle Updates

Owner Verification

Blacklist Vehicles

LGU Executive

Executive Dashboard

Analytics

Revenue

Traffic Reports

Performance Metrics

Policy Dashboard

Citizen

Login

Register Vehicle

Pay Fine

Appeal

View Violations

Download Receipt

Notifications

Profile

Security

Enterprise Authentication

JWT

Refresh Token

Role-Based Access Control

Permission Matrix

AES Encryption

HTTPS

CSRF Protection

Rate Limiting

SQL Injection Protection

XSS Protection

CSP

2FA

Password Hashing

Audit Trail

Session Timeout

Device Logging

Login History

Dashboard Features

Live Statistics

Live Camera Feed

Violation Heatmap

Interactive Maps

Animated Charts

Officer Status

Recent Violations

AI Alerts

Pending Appeals

Revenue

System Health

Server Status

Camera Status

IoT Status

Database

Design a fully normalized PostgreSQL database including:

Users

Roles

Permissions

Officers

Citizens

Vehicles

Violations

Citations

Payments

Appeals

Cameras

IoT Devices

AI Detections

Notifications

Audit Logs

Activity Logs

Traffic Reports

GPS Locations

Traffic Density

Public Transport

Road Segments

Weather Data

Include complete:

ERD

Relationships

Foreign Keys

Constraints

Indexes

Row-Level Security (RLS) policies in Supabase

Additional Features

AI-powered violation detection dashboard

Live CCTV monitoring with AI overlays

Automatic license plate recognition (LPR)

Interactive GIS traffic map

QR code-enabled digital citations

Real-time notifications via email and in-app alerts

Advanced search with filters and global command palette

Export reports to PDF, Excel, and CSV

Multi-language support (English and Filipino)

Accessibility compliant (WCAG 2.1 AA)

Offline synchronization for field officers

Comprehensive audit logs and activity history

Mobile-first responsive design with PWA support

Dark and light themes

Interactive onboarding and guided tours

Data visualization with real-time analytics

High-performance architecture with lazy loading, code splitting, and caching

Expected Output

Generate a complete enterprise-grade application architecture, including:

Modern premium UI/UX design system

Complete React + TypeScript frontend

Node.js + Express backend

Supabase database schema with RLS

Role-Based Access Control (RBAC) implementation

AI and IoT integration architecture

RESTful API documentation

Responsive layouts for desktop, tablet, and mobile

Reusable component library

Authentication and authorization flow

State management strategy

Folder structure following scalable enterprise best practices

Security architecture

Deployment configuration

Production-ready, clean, modular, maintainable, and well-documented code following SOLID principles and industry best practices.



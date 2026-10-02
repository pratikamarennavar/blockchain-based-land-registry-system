import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Open pages in a NEW TAB
  const openNewTab = (path) => {
    window.open(path, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="home-page">

      <style>{`

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: "Inter", "Segoe UI", Arial, sans-serif;
          background: #f5f8f6;
          color: #173b2b;
        }

        button {
          font-family: inherit;
        }

        /* ================= NAVBAR ================= */

        .home-navbar {
          height: 76px;
          width: 100%;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 6%;

          background: rgba(255, 255, 255, 0.97);
          border-bottom: 1px solid #e2ebe5;

          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .brand-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;

          background: linear-gradient(135deg, #087f5b, #0ca678);

          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 22px;
          font-weight: 800;

          box-shadow: 0 7px 18px rgba(8, 127, 91, 0.25);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-size: 20px;
          font-weight: 800;
          color: #123c2a;
        }

        .brand-subtitle {
          font-size: 10px;
          color: #71847a;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .home-nav {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .home-nav button {
          border: none;
          background: transparent;
          cursor: pointer;

          color: #52645b;
          font-size: 14px;
          font-weight: 600;

          padding: 10px 2px;
          transition: 0.2s;
        }

        .home-nav button:hover,
        .home-nav .active {
          color: #087f5b;
        }

        .home-actions {
          display: flex;
          gap: 10px;
        }

        .login-button,
        .register-button {
          padding: 11px 20px;
          border-radius: 9px;

          cursor: pointer;

          font-size: 14px;
          font-weight: 700;

          transition: 0.25s;
        }

        .login-button {
          border: 1px solid #b9cec2;
          background: white;
          color: #176347;
        }

        .login-button:hover {
          background: #edf7f2;
        }

        .register-button {
          border: 1px solid #087f5b;
          background: #087f5b;
          color: white;
        }

        .register-button:hover {
          background: #066b4d;
          transform: translateY(-1px);
        }

        /* ================= HERO ================= */

        .hero {
          min-height: 730px;
          padding-top: 76px;

          position: relative;
          overflow: hidden;

          display: flex;
          align-items: center;
        }

        .hero-background {
          position: absolute;
          inset: 0;

          background-image:
            linear-gradient(
              90deg,
              rgba(3, 42, 29, 0.94) 0%,
              rgba(4, 57, 39, 0.86) 42%,
              rgba(4, 57, 39, 0.57) 72%,
              rgba(4, 57, 39, 0.35) 100%
            ),
            url(
              "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2200&q=90"
            );

          background-size: cover;
          background-position: center;
          z-index: 0;
        }

        .hero-grid {
          position: absolute;
          inset: 0;

          background-image:
            linear-gradient(
              rgba(120, 239, 176, 0.045) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(120, 239, 176, 0.045) 1px,
              transparent 1px
            );

          background-size: 55px 55px;
          z-index: 1;
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 3;

          width: 88%;
          max-width: 1250px;

          margin: auto;

          display: grid;
          grid-template-columns: 1fr 1fr;

          gap: 55px;
          align-items: center;

          padding: 65px 0;
        }

        /* ================= HERO LEFT ================= */

        .hero-left {
          color: white;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          padding: 9px 15px;

          border-radius: 50px;

          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.27);

          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;

          margin-bottom: 24px;

          backdrop-filter: blur(8px);
        }

        .hero-badge-dot {
          width: 8px;
          height: 8px;

          background: #7bf1b3;
          border-radius: 50%;

          box-shadow: 0 0 12px #7bf1b3;
        }

        .hero-title {
          font-size: clamp(52px, 5vw, 72px);

          line-height: 0.98;
          font-weight: 900;

          letter-spacing: -3px;

          max-width: 680px;
        }

        .hero-title .green {
          color: #78efb0;
        }

        .project-name {
          display: block;

          margin-top: 25px;
          padding-top: 20px;

          border-top: 1px solid rgba(255, 255, 255, 0.22);

          color: rgba(255, 255, 255, 0.96);

          font-size: clamp(21px, 2vw, 29px);

          line-height: 1.3;

          letter-spacing: -0.5px;
          font-weight: 700;
        }

        .hero-description {
          margin-top: 23px;

          max-width: 620px;

          color: rgba(255, 255, 255, 0.84);

          font-size: 15px;
          line-height: 1.8;
        }

        .hero-actions {
          display: flex;
          gap: 13px;

          margin-top: 30px;
          flex-wrap: wrap;
        }

        .primary-hero-button,
        .secondary-hero-button {
          padding: 14px 24px;

          border-radius: 10px;

          font-size: 14px;
          font-weight: 800;

          cursor: pointer;
          transition: 0.25s;
        }

        .primary-hero-button {
          border: none;

          background: #10a86d;
          color: white;

          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.22);
        }

        .primary-hero-button:hover {
          background: #0d925f;
          transform: translateY(-2px);
        }

        .secondary-hero-button {
          border: 1px solid rgba(255, 255, 255, 0.4);

          background: rgba(255, 255, 255, 0.09);
          color: white;
        }

        .secondary-hero-button:hover {
          background: rgba(255, 255, 255, 0.18);
        }

        /* ================= BLOCKCHAIN DIAGRAM ================= */

        .blockchain-area {
          width: 100%;
          height: 440px;

          position: relative;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .blockchain-glow {
          position: absolute;

          width: 320px;
          height: 320px;

          border-radius: 50%;

          background: rgba(63, 235, 160, 0.18);

          filter: blur(45px);
        }

        .blockchain-diagram {
          width: 500px;
          height: 420px;

          position: relative;
          max-width: 100%;
        }

        .connection {
          position: absolute;

          height: 2px;

          background: rgba(115, 241, 179, 0.7);

          transform-origin: left center;

          z-index: 1;
        }

        .connection-one {
          width: 145px;
          left: 110px;
          top: 126px;
          transform: rotate(20deg);
        }

        .connection-two {
          width: 145px;
          left: 275px;
          top: 126px;
          transform: rotate(-20deg);
        }

        .connection-three {
          width: 145px;
          left: 110px;
          top: 294px;
          transform: rotate(-20deg);
        }

        .connection-four {
          width: 145px;
          left: 275px;
          top: 294px;
          transform: rotate(20deg);
        }

        .diagram-card {
          position: absolute;

          width: 125px;
          height: 105px;

          border-radius: 17px;

          background: rgba(255, 255, 255, 0.95);

          border: 1px solid rgba(255, 255, 255, 0.85);

          box-shadow:
            0 18px 40px rgba(0, 0, 0, 0.20),
            inset 0 0 18px rgba(20, 130, 85, 0.04);

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          z-index: 4;

          backdrop-filter: blur(8px);
        }

        .diagram-card-icon {
          width: 38px;
          height: 38px;

          border-radius: 11px;

          background: #e5f6ed;
          color: #087f5b;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 20px;
          margin-bottom: 6px;
        }

        .diagram-card strong {
          color: #173b2b;
          font-size: 12px;
          font-weight: 800;
        }

        .diagram-card span {
          color: #87948e;
          font-size: 9px;
          margin-top: 3px;
        }

        .land-card {
          left: 18px;
          top: 55px;
        }

        .verify-card {
          right: 18px;
          top: 55px;
        }

        .record-card {
          left: 18px;
          bottom: 55px;
        }

        .owner-card {
          right: 18px;
          bottom: 55px;
        }

        .blockchain-center {
          position: absolute;

          left: 50%;
          top: 50%;

          transform: translate(-50%, -50%);

          width: 145px;
          height: 145px;

          border-radius: 24px;

          background: linear-gradient(
            145deg,
            #087f5b,
            #12b878
          );

          border: 1px solid rgba(255, 255, 255, 0.4);

          color: white;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          z-index: 8;

          box-shadow:
            0 25px 55px rgba(0, 0, 0, 0.3),
            0 0 35px rgba(70, 241, 166, 0.28);
        }

        .blockchain-icon {
          width: 58px;
          height: 58px;

          border-radius: 16px;

          background: rgba(255, 255, 255, 0.15);

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 29px;
          margin-bottom: 9px;
        }

        .blockchain-center strong {
          font-size: 13px;
          letter-spacing: 0.7px;
        }

        .blockchain-center span {
          font-size: 9px;
          opacity: 0.82;
          margin-top: 5px;
        }

        /* ================= SECTIONS ================= */

        .quick-section,
        .features-section {
          background: #f5f8f6;
          padding: 78px 6%;
        }

        .section-heading {
          text-align: center;

          max-width: 700px;

          margin: 0 auto 42px;
        }

        .section-label {
          color: #087f5b;

          font-size: 12px;
          font-weight: 800;

          text-transform: uppercase;
          letter-spacing: 1.8px;

          margin-bottom: 10px;
        }

        .section-heading h2 {
          font-size: 34px;
          color: #173b2b;
          margin-bottom: 12px;
        }

        .section-heading p {
          color: #718179;
          font-size: 14px;
          line-height: 1.7;
        }

        .role-grid,
        .feature-grid {
          max-width: 1150px;
          margin: auto;

          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }

        .role-card {
          background: white;

          border: 1px solid #e1ebe5;
          border-radius: 18px;

          padding: 28px;

          box-shadow:
            0 8px 25px rgba(22, 61, 43, 0.05);

          transition: 0.3s;
        }

        .role-card:hover {
          transform: translateY(-7px);

          box-shadow:
            0 18px 38px rgba(22, 61, 43, 0.12);
        }

        .role-icon,
        .feature-symbol {
          width: 54px;
          height: 54px;

          border-radius: 14px;

          background: #e7f6ee;
          color: #087f5b;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 23px;
          margin-bottom: 18px;
        }

        .role-card h3 {
          color: #173b2b;
          font-size: 20px;
          margin-bottom: 9px;
        }

        .role-card p {
          color: #728178;

          font-size: 13px;
          line-height: 1.7;

          min-height: 65px;
        }

        .role-link {
          margin-top: 18px;

          border: none;
          background: transparent;

          color: #087f5b;

          font-size: 13px;
          font-weight: 800;

          cursor: pointer;
        }

        /* ================= PROCESS ================= */

        .process-section {
          background: white;
          padding: 80px 6%;
        }

        .process-grid {
          max-width: 1100px;
          margin: auto;

          display: grid;
          grid-template-columns: repeat(5, 1fr);

          gap: 18px;
        }

        .process-card {
          text-align: center;
        }

        .process-number {
          width: 50px;
          height: 50px;

          margin: 0 auto 15px;

          border-radius: 50%;

          background: #087f5b;
          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 15px;
          font-weight: 800;

          box-shadow:
            0 8px 20px rgba(8, 127, 91, 0.2);
        }

        .process-card h4 {
          font-size: 14px;
          color: #244536;
          margin-bottom: 7px;
        }

        .process-card p {
          color: #819087;
          font-size: 11px;
          line-height: 1.6;
        }

        /* ================= FEATURES ================= */

        .feature-card {
          background: white;

          border-radius: 16px;
          padding: 27px;

          border: 1px solid #e4ece7;

          transition: 0.25s;
        }

        .feature-card:hover {
          transform: translateY(-4px);

          box-shadow:
            0 14px 35px rgba(25, 70, 48, 0.08);
        }

        .feature-symbol {
          width: 44px;
          height: 44px;

          font-size: 20px;
          margin-bottom: 17px;
        }

        .feature-card h3 {
          font-size: 17px;
          color: #1b4332;
          margin-bottom: 8px;
        }

        .feature-card p {
          color: #78877f;
          font-size: 13px;
          line-height: 1.7;
        }

        /* ================= CONTACT ================= */

        .contact-section {
          background: white;

          padding: 70px 6%;

          text-align: center;
        }

        .contact-section h2 {
          color: #173b2b;
          font-size: 30px;
          margin-bottom: 12px;
        }

        .contact-section p {
          color: #78877f;

          max-width: 600px;
          margin: auto;

          line-height: 1.7;
          font-size: 14px;
        }

        /* ================= FOOTER ================= */

        .footer {
          background: #102d21;
          color: white;

          padding: 42px 6% 25px;
        }

        .footer-top {
          max-width: 1150px;

          margin: auto;

          display: flex;
          justify-content: space-between;

          gap: 30px;
        }

        .footer-brand {
          max-width: 380px;
        }

        .footer-brand h3 {
          font-size: 20px;
          margin-bottom: 10px;
        }

        .footer-brand p {
          color: #aabdb3;

          font-size: 12px;
          line-height: 1.7;
        }

        .footer-links h4 {
          font-size: 13px;
          margin-bottom: 12px;
        }

        .footer-links button {
          display: block;

          background: none;
          border: none;

          color: #aabdb3;

          font-size: 12px;

          margin-bottom: 9px;

          cursor: pointer;
        }

        .footer-links button:hover {
          color: white;
        }

        .footer-bottom {
          max-width: 1150px;

          margin: 30px auto 0;

          padding-top: 20px;

          border-top: 1px solid rgba(255, 255, 255, 0.1);

          display: flex;
          justify-content: space-between;

          color: #8da59a;

          font-size: 11px;
        }

        /* ================= MODAL ================= */

        .modal-overlay {
          position: fixed;
          inset: 0;

          background: rgba(8, 27, 19, 0.68);

          z-index: 3000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          backdrop-filter: blur(5px);
        }

        .modal {
          width: 100%;
          max-width: 500px;

          background: white;

          border-radius: 22px;

          padding: 30px;

          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.3);

          position: relative;

          animation: modalOpen 0.22s ease;
        }

        @keyframes modalOpen {
          from {
            opacity: 0;
            transform: translateY(15px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-close {
          position: absolute;

          right: 20px;
          top: 18px;

          width: 34px;
          height: 34px;

          border-radius: 50%;

          border: none;

          background: #f0f4f2;

          color: #52645b;

          cursor: pointer;

          font-size: 18px;
        }

        .modal-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .modal-header-icon {
          width: 55px;
          height: 55px;

          border-radius: 16px;

          background: #e5f6ed;
          color: #087f5b;

          display: flex;
          align-items: center;
          justify-content: center;

          margin: 0 auto 15px;

          font-size: 24px;
        }

        .modal-header h2 {
          color: #173b2b;
          font-size: 23px;
        }

        .modal-header p {
          color: #7a8982;
          font-size: 13px;
          margin-top: 7px;
        }

        .login-options {
          display: grid;
          gap: 12px;
        }

        .login-option {
          width: 100%;

          display: flex;
          align-items: center;
          gap: 15px;

          padding: 16px;

          background: white;

          border: 1px solid #e0e9e4;
          border-radius: 13px;

          cursor: pointer;

          text-align: left;

          transition: 0.22s;
        }

        .login-option:hover {
          border-color: #76b89b;
          background: #f5fbf8;

          transform: translateX(3px);
        }

        .login-option-icon {
          width: 43px;
          height: 43px;

          border-radius: 11px;

          background: #e7f6ee;
          color: #087f5b;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 18px;

          flex-shrink: 0;
        }

        .login-option strong {
          display: block;

          color: #1e4333;
          font-size: 14px;
        }

        .login-option span {
          display: block;

          color: #84928b;
          font-size: 11px;

          margin-top: 4px;
        }

        /* ================= REGISTER MODAL ================= */

        .register-options {
          display: grid;

          grid-template-columns: 1fr 1fr;

          gap: 15px;
        }

        .register-option {
          border: 1px solid #dfe9e4;

          background: white;

          border-radius: 15px;

          padding: 25px 15px;

          cursor: pointer;

          text-align: center;

          transition: 0.22s;
        }

        .register-option:hover {
          border-color: #70b895;

          background: #f4fbf7;

          transform: translateY(-3px);
        }

        .register-option-icon {
          width: 50px;
          height: 50px;

          border-radius: 13px;

          margin: 0 auto 12px;

          background: #e5f6ed;
          color: #087f5b;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 22px;
        }

        .register-option h3 {
          font-size: 15px;
          color: #234838;
        }

        .register-option p {
          font-size: 11px;
          color: #839089;

          margin-top: 5px;

          line-height: 1.5;
        }

        /* ================= RESPONSIVE ================= */

        @media (max-width: 1050px) {

          .home-nav {
            gap: 20px;
          }

          .hero-content {
            grid-template-columns: 1fr;
          }

          .blockchain-area {
            margin: 0 auto;
          }

          .process-grid {
            grid-template-columns: repeat(3, 1fr);
            row-gap: 35px;
          }
        }

        @media (max-width: 760px) {

          .home-navbar {
            padding: 0 4%;
          }

          .home-nav {
            display: none;
          }

          .brand-subtitle {
            display: none;
          }

          .home-actions {
            gap: 5px;
          }

          .login-button,
          .register-button {
            padding: 9px 12px;
            font-size: 12px;
          }

          .hero {
            min-height: auto;
          }

          .hero-content {
            width: 90%;
            padding: 65px 0;
          }

          .hero-title {
            font-size: 52px;
            letter-spacing: -2px;
          }

          .project-name {
            font-size: 21px;
          }

          .hero-description {
            font-size: 14px;
          }

          .blockchain-area {
            height: 390px;
          }

          .blockchain-diagram {
            transform: scale(0.82);
          }

          .role-grid,
          .feature-grid {
            grid-template-columns: 1fr;
          }

          .process-grid {
            grid-template-columns: 1fr 1fr;
          }

          .footer-top {
            flex-direction: column;
          }

          .footer-bottom {
            flex-direction: column;
            gap: 8px;
          }
        }

        @media (max-width: 520px) {

          .brand-title {
            font-size: 16px;
          }

          .brand-icon {
            width: 38px;
            height: 38px;
          }

          .home-actions {
            display: none;
          }

          .hero-title {
            font-size: 43px;
          }

          .project-name {
            font-size: 19px;
          }

          .blockchain-area {
            height: 350px;
          }

          .blockchain-diagram {
            transform: scale(0.65);
          }

          .process-grid {
            grid-template-columns: 1fr;
          }

          .register-options {
            grid-template-columns: 1fr;
          }
        }

      `}</style>


      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="home-navbar">

        <div
          className="brand"
          onClick={() => navigate("/")}
        >
          <div className="brand-icon">
            ⌂
          </div>

          <div className="brand-text">
            <div className="brand-title">
              BHOOMI SETU
            </div>

            <div className="brand-subtitle">
              Digital Land Registry
            </div>
          </div>
        </div>


        <nav className="home-nav">

          <button
            className="active"
            onClick={() => navigate("/")}
          >
            Home
          </button>

          <button
            onClick={() =>
              document
                .getElementById("about-section")
                ?.scrollIntoView({
                  behavior: "smooth"
                })
            }
          >
            About
          </button>

          <button
            onClick={() =>
              document
                .getElementById("contact-section")
                ?.scrollIntoView({
                  behavior: "smooth"
                })
            }
          >
            Contact
          </button>

        </nav>


        <div className="home-actions">

          <button
            className="login-button"
            onClick={() => setShowLogin(true)}
          >
            Login
          </button>

          <button
            className="register-button"
            onClick={() => setShowRegister(true)}
          >
            Register
          </button>

        </div>

      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero">

        <div className="hero-background"></div>

        <div className="hero-grid"></div>


        <div className="hero-content">


          <div className="hero-left">

            <div className="hero-badge">

              <span className="hero-badge-dot"></span>

              BHOOMI SETU • BLOCKCHAIN LAND REGISTRY

            </div>


            <h1 className="hero-title">

              BHOOMI

              <br />

              <span className="green">
                SETU.
              </span>

              <span className="project-name">
                Blockchain Based Land Registry System
              </span>

            </h1>


            <p className="hero-description">

              A secure digital land registry system
              connecting property owners, buyers and
              administrators through verified workflows,
              transparent ownership records and
              blockchain technology.

            </p>


            <div className="hero-actions">

              <button
                className="primary-hero-button"
                onClick={() => setShowRegister(true)}
              >
                Get Started →
              </button>


              <button
                className="secondary-hero-button"
                onClick={() => setShowLogin(true)}
              >
                Access Portal
              </button>

            </div>

          </div>


          {/* BLOCKCHAIN DIAGRAM */}

          <div className="blockchain-area">

            <div className="blockchain-glow"></div>

            <div className="blockchain-diagram">

              <div className="connection connection-one"></div>

              <div className="connection connection-two"></div>

              <div className="connection connection-three"></div>

              <div className="connection connection-four"></div>


              <div className="diagram-card land-card">

                <div className="diagram-card-icon">
                  🏠
                </div>

                <strong>
                  LAND
                </strong>

                <span>
                  Property Record
                </span>

              </div>


              <div className="diagram-card verify-card">

                <div className="diagram-card-icon">
                  ✓
                </div>

                <strong>
                  VERIFY
                </strong>

                <span>
                  Admin Approval
                </span>

              </div>


              <div className="diagram-card record-card">

                <div className="diagram-card-icon">
                  📄
                </div>

                <strong>
                  RECORD
                </strong>

                <span>
                  Digital Document
                </span>

              </div>


              <div className="diagram-card owner-card">

                <div className="diagram-card-icon">
                  👤
                </div>

                <strong>
                  OWNER
                </strong>

                <span>
                  Ownership Data
                </span>

              </div>


              <div className="blockchain-center">

                <div className="blockchain-icon">
                  ⛓
                </div>

                <strong>
                  BLOCKCHAIN
                </strong>

                <span>
                  Trusted Record
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PORTALS
      ===================================================== */}

      <section
        className="quick-section"
        id="portal-section"
      >

        <div className="section-heading">

          <div className="section-label">
            PLATFORM ACCESS
          </div>

          <h2>
            Choose Your Portal
          </h2>

          <p>
            Access the workspace designed for your role
            in the land registry system.
          </p>

        </div>


        <div className="role-grid">


          {/* SELLER */}

          <div className="role-card">

            <div className="role-icon">
              ♙
            </div>

            <h3>
              Seller Portal
            </h3>

            <p>
              Register properties, submit land documents,
              monitor verification and manage ownership.
            </p>

            <button
              className="role-link"
              onClick={() =>
                openNewTab("/seller/login")
              }
            >
              Open Seller Portal →
            </button>

          </div>


          {/* BUYER */}

          <div className="role-card">

            <div className="role-icon">
              ◉
            </div>

            <h3>
              Buyer Portal
            </h3>

            <p>
              Browse verified properties, submit purchase
              requests and follow property transactions.
            </p>

            <button
              className="role-link"
              onClick={() =>
                openNewTab("/buyer/login")
              }
            >
              Open Buyer Portal →
            </button>

          </div>


          {/* ADMIN */}

          <div className="role-card">

            <div className="role-icon">
              ⚙
            </div>

            <h3>
              Admin Portal
            </h3>

            <p>
              Verify users and land records and manage
              the overall registry workflow.
            </p>

            <button
              className="role-link"
              onClick={() =>
                openNewTab("/login")
              }
            >
              Open Admin Portal →
            </button>

          </div>

        </div>

      </section>


      {/* =====================================================
          ABOUT / WORKFLOW
      ===================================================== */}

      <section
        className="process-section"
        id="about-section"
      >

        <div className="section-heading">

          <div className="section-label">
            LAND REGISTRY WORKFLOW
          </div>

          <h2>
            From Registration to Ownership
          </h2>

          <p>
            A structured workflow connecting registration,
            verification, purchase requests and ownership.
          </p>

        </div>


        <div className="process-grid">

          <div className="process-card">
            <div className="process-number">
              01
            </div>

            <h4>
              Register
            </h4>

            <p>
              User creates an account.
            </p>
          </div>


          <div className="process-card">
            <div className="process-number">
              02
            </div>

            <h4>
              Submit Land
            </h4>

            <p>
              Seller submits property details.
            </p>
          </div>


          <div className="process-card">
            <div className="process-number">
              03
            </div>

            <h4>
              Verify
            </h4>

            <p>
              Admin verifies records.
            </p>
          </div>


          <div className="process-card">
            <div className="process-number">
              04
            </div>

            <h4>
              Request
            </h4>

            <p>
              Buyer requests a property.
            </p>
          </div>


          <div className="process-card">
            <div className="process-number">
              05
            </div>

            <h4>
              Transfer
            </h4>

            <p>
              Ownership workflow is completed.
            </p>
          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section className="features-section">

        <div className="section-heading">

          <div className="section-label">
            PLATFORM FEATURES
          </div>

          <h2>
            Trusted Digital Land Records
          </h2>

          <p>
            The major stages of property registration
            and ownership management in one platform.
          </p>

        </div>


        <div className="feature-grid">

          <div className="feature-card">

            <div className="feature-symbol">
              🔐
            </div>

            <h3>
              Secure Records
            </h3>

            <p>
              Property information can be linked with
              blockchain transactions for record integrity.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-symbol">
              ✓
            </div>

            <h3>
              Verified Properties
            </h3>

            <p>
              Land records pass through an administrative
              verification workflow.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-symbol">
              ⛓
            </div>

            <h3>
              Blockchain
            </h3>

            <p>
              Smart-contract transactions support the
              blockchain component of the registry.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          CONTACT
      ===================================================== */}

      <section
        className="contact-section"
        id="contact-section"
      >

        <div className="section-label">
          CONTACT
        </div>

        <h2>
          BHOOMI SETU
        </h2>

        <p>
          Blockchain Based Land Registry System for
          digital property registration, verification
          and ownership management.
        </p>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="footer">

        <div className="footer-top">

          <div className="footer-brand">

            <h3>
              BHOOMI SETU
            </h3>

            <p>
              Blockchain Based Land Registry System for
              digital property registration, verification
              and ownership management.
            </p>

          </div>


          <div className="footer-links">

            <h4>
              Portals
            </h4>

            <button
              onClick={() =>
                openNewTab("/seller/login")
              }
            >
              Seller Login
            </button>

            <button
              onClick={() =>
                openNewTab("/buyer/login")
              }
            >
              Buyer Login
            </button>

            {/* CORRECT ADMIN LOGIN ROUTE */}

            <button
              onClick={() =>
                openNewTab("/login")
              }
            >
              Admin Login
            </button>

          </div>


          <div className="footer-links">

            <h4>
              Account
            </h4>

            <button
              onClick={() =>
                setShowRegister(true)
              }
            >
              Create Account
            </button>

            <button
              onClick={() =>
                setShowLogin(true)
              }
            >
              Login
            </button>

          </div>

        </div>


        <div className="footer-bottom">

          <span>
            © 2026 BHOOMI SETU
          </span>

          <span>
            Blockchain Based Land Registry System
          </span>

        </div>

      </footer>


      {/* =====================================================
          LOGIN MODAL
      ===================================================== */}

      {showLogin && (

        <div
          className="modal-overlay"
          onClick={() => setShowLogin(false)}
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setShowLogin(false)
              }
            >
              ×
            </button>


            <div className="modal-header">

              <div className="modal-header-icon">
                ⇥
              </div>

              <h2>
                Welcome Back
              </h2>

              <p>
                Select the portal you want to access
              </p>

            </div>


            <div className="login-options">


              {/* SELLER */}

              <button
                className="login-option"
                onClick={() => {

                  setShowLogin(false);

                  openNewTab(
                    "/seller/login"
                  );

                }}
              >

                <div className="login-option-icon">
                  ♙
                </div>

                <div>

                  <strong>
                    Seller Login
                  </strong>

                  <span>
                    Manage properties and ownership records
                  </span>

                </div>

              </button>


              {/* BUYER */}

              <button
                className="login-option"
                onClick={() => {

                  setShowLogin(false);

                  openNewTab(
                    "/buyer/login"
                  );

                }}
              >

                <div className="login-option-icon">
                  ◉
                </div>

                <div>

                  <strong>
                    Buyer Login
                  </strong>

                  <span>
                    Browse properties and manage requests
                  </span>

                </div>

              </button>


              {/* ADMIN - CORRECT ROUTE IS /login */}

              <button
                className="login-option"
                onClick={() => {

                  setShowLogin(false);

                  openNewTab(
                    "/login"
                  );

                }}
              >

                <div className="login-option-icon">
                  ⚙
                </div>

                <div>

                  <strong>
                    Admin Login
                  </strong>

                  <span>
                    Verify users, land and manage the registry
                  </span>

                </div>

              </button>


            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          REGISTER MODAL
      ===================================================== */}

      {showRegister && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowRegister(false)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setShowRegister(false)
              }
            >
              ×
            </button>


            <div className="modal-header">

              <div className="modal-header-icon">
                +
              </div>

              <h2>
                Create Your Account
              </h2>

              <p>
                Choose the account type you want to create
              </p>

            </div>


            <div className="register-options">


              {/* SELLER REGISTER */}

              <button
                className="register-option"
                onClick={() => {

                  setShowRegister(false);

                  openNewTab(
                    "/seller/register"
                  );

                }}
              >

                <div className="register-option-icon">
                  ♙
                </div>

                <h3>
                  Seller
                </h3>

                <p>
                  Register properties and manage your land.
                </p>

              </button>


              {/* BUYER REGISTER */}

              <button
                className="register-option"
                onClick={() => {

                  setShowRegister(false);

                  openNewTab(
                    "/buyer/register"
                  );

                }}
              >

                <div className="register-option-icon">
                  ◉
                </div>

                <h3>
                  Buyer
                </h3>

                <p>
                  Create an account to browse and request properties.
                </p>

              </button>


            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Home;
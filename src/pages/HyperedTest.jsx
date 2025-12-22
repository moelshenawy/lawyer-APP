import React, { useState } from "react";

export default function HyperedTest() {
  const [logs, setLogs] = useState("");

  function log(msg) {
    setLogs((prev) => prev + `[${new Date().toLocaleTimeString()}] ${msg}\n`);
  }

  const handleIsInApp = () => {
    Hypered.isInApp()
      .then((result) => {
        log(`isInApp: ${result}`);
      })
      .catch((err) => {
        log(`isInApp error: ${err}`);
      });
  };

  const handleToast = () => {
    Hypered.toast("Hello from Hypered")
      .then(() => {
        log("toast: success");
      })
      .catch((err) => {
        log(`toast error: ${err}`);
      });
  };

  const handleGoogleLogin = () => {
    Hypered.loginWithGoogle()
      .then((data) => {
        log(`Google login: ${JSON.stringify(data)}`);
      })
      .catch((err) => {
        log(`Google login error: ${err}`);
      });
  };

  const handleSaveBiometric = () => {
    const token = window.prompt("Enter biometric token to save:", "demo-token");
    if (token === null) {
      log("saveBiometricToken: cancelled");
      return;
    }
    Hypered.saveBiometricToken(token)
      .then(() => {
        log(`saveBiometricToken: saved "${token}"`);
      })
      .catch((err) => {
        log(`saveBiometricToken error: ${err}`);
      });
  };

  const handleLoadBiometric = () => {
    Hypered.loadBiometricToken()
      .then((token) => {
        log(`loadBiometricToken: ${token}`);
      })
      .catch((err) => {
        log(`loadBiometricToken error: ${err}`);
      });
  };

  const handleNotify = () => {
    Hypered.notify({
      title: "Hypered Test",
      body: "Local notification from tester",
    })
      .then((result) => {
        log(`notify: ${JSON.stringify(result)}`);
      })
      .catch((err) => {
        log(`notify error: ${err}`);
      });
  };

  return (
    <div style={{ padding: "16px", fontFamily: "sans-serif" }}>
      <a href="/ar">Home Page</a>
      <h1>Hypered Bridge Tester</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button className={"bg-primary text-white"} onClick={handleToast}>
          Show toast using Hypered.toast()
        </button>
        <button className={"bg-primary text-white"} onClick={handleIsInApp}>
          Test isInApp()
        </button>
        <button className={"bg-primary text-white"} onClick={handleSaveBiometric}>
          Save biometric token using Hypered.saveBiometricToken()
        </button>
        <button className={"bg-primary text-white"} onClick={handleLoadBiometric}>
          Load biometric token using Hypered.loadBiometricToken()
        </button>
        <button className={"bg-primary text-white"} onClick={handleGoogleLogin}>
          Login with Google using Hypered.loginWithGoogle()
        </button>
        {/* <button  className={'bg-primary text-white'} onClick={handleNotify}>
          Send notification using Hypered.notify()
        </button> */}
      </div>
      <pre style={{ marginTop: "16px", padding: "12px", background: "#f5f5f5" }}>
        {logs || "Logs will appear here..."}
      </pre>
    </div>
  );
}

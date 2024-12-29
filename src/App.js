import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { auth } from './firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const App = () => {
  const [phone, setPhone] = useState('+91');
  const [hasFilled, setHasFilled] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const generateRecaptcha = () => {
    if (!window.recaptchaVerifier || window.recaptchaVerifier.destroyed) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        'recaptcha',
        {
          size: 'invisible',
          callback: (response) => {
            console.log('Recaptcha verified:', response);
          },
        },
        auth
      );
    }
  };

  const sendOtp = () => {
    setTimer(30); // Reset timer
    setCanResend(false); // Disable resend button

    generateRecaptcha();
    const appVerifier = window.recaptchaVerifier;

    signInWithPhoneNumber(auth, phone, appVerifier)
      .then((confirmationResult) => {
        window.confirmationResult = confirmationResult;
        console.log('OTP sent successfully.');
      })
      .catch((error) => {
        console.error('Error sending OTP:', error);
      });
  };

  const handleSend = (event) => {
    event.preventDefault();
    setHasFilled(true);
    sendOtp();
  };

  const handleResend = () => {
    sendOtp(); // Resend the OTP
  };

  const verifyOtp = (event) => {
    const otp = event.target.value;
    setOtp(otp);

    if (otp.length === 6) {
      const confirmationResult = window.confirmationResult;
      confirmationResult
        .confirm(otp)
        .then((result) => {
          const user = result.user;
          console.log('User signed in successfully:', user);
          alert('User signed in successfully');
        })
        .catch((error) => {
          console.error('Error verifying OTP:', error);
          alert('Invalid OTP. Please try again.');
        });
    }
  };

  if (!hasFilled) {
    return (
      <div className="app__container">
        <Card sx={{ width: '300px' }}>
          <CardContent
            sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}
          >
            <Typography sx={{ padding: '20px' }} variant="h5" component="div">
              Enter your phone number
            </Typography>
            <form onSubmit={handleSend}>
              <TextField
                sx={{ width: '240px' }}
                variant="outlined"
                autoComplete="off"
                label="Phone Number"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                sx={{ width: '240px', marginTop: '20px' }}
              >
                Send Code
              </Button>
            </form>
          </CardContent>
        </Card>
        <div id="recaptcha"></div>
      </div>
    );
  } else {
    return (
      <div className="app__container">
        <Card sx={{ width: '300px' }}>
          <CardContent
            sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}
          >
            <Typography sx={{ padding: '20px' }} variant="h5" component="div">
              Enter the OTP
            </Typography>
            <TextField
              sx={{ width: '240px' }}
              variant="outlined"
              label="OTP"
              value={otp}
              onChange={verifyOtp}
            />
            <Button
              variant="contained"
              sx={{ width: '240px', marginTop: '20px' }}
              onClick={handleResend}
              disabled={!canResend}
            >
              Resend OTP
            </Button>
            {timer > 0 && (
              <Typography sx={{ marginTop: '10px' }} variant="body2">
                Resend available in {timer} seconds
              </Typography>
            )}
          </CardContent>
        </Card>
        <div id="recaptcha"></div>
      </div>
    );
  }
};

export default App;

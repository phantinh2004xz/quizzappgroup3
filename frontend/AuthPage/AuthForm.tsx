import React, { useState } from 'react';
import InputField from './InputField';
import SocialIcons from './SocialIcons';
import { UserIcon, LockIcon, EmailIcon } from './Icons';
import { useNavigate } from 'react-router-dom';

import { auth, db, googleProvider } from '../shared/firebase-config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthFormProps {
  onClose: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onClose }) => {
  const [activePanel, setActivePanel] = useState<'signIn' | 'signUp'>('signIn');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animateToCover, setAnimateToCover] = useState(false);

  // State cho form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  // -------- Animation overlay ---------
  const DURATION_VAL = 600; // ms
  const DURATION_CLASS = `duration-[${DURATION_VAL}ms]`;

  const handleTogglePanel = (targetPanel: 'signIn' | 'signUp') => {
    if (isAnimating || targetPanel === activePanel) return;
    setIsAnimating(true);
    setAnimateToCover(true);
    setTimeout(() => {
      setActivePanel(targetPanel);
      setAnimateToCover(false);
    }, DURATION_VAL);
    setTimeout(() => {
      setIsAnimating(false);
    }, DURATION_VAL * 2);
  };

  // Đăng ký user, lưu profile kèm role 'user'
  const handleSignUpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        username: signUpUsername,
        email: signUpEmail,
        role: 'user',
        createdAt: new Date()
      });
      alert('Đăng ký thành công! Đăng nhập ngay để tiếp tục.');
      setActivePanel('signIn');
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  // Đăng nhập, lấy quyền từ Firestore, chuyển trang phù hợp
  const handleSignInSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) throw new Error('Không tìm thấy profile!');
      const { role } = userDoc.data() as { role: string };
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
      onClose();
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  // Đăng nhập Google, lấy/tạo profile trên Firestore, điều hướng
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      let role = 'user';
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          username: user.displayName || '',
          email: user.email || '',
          role: 'user',
          createdAt: new Date()
        });
      } else {
        role = (userDoc.data() as { role: string }).role;
      }
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
      onClose();
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  // --------- UI PART ----------

  const commonIconClass = "w-4 h-4 text-gray-400";
  const overlayBaseClasses = `absolute top-0 h-full bg-indigo-500 text-white overflow-hidden z-30 transition-all ${DURATION_CLASS} ease-in-out`;
  let overlayDynamicClasses = '';
  if (animateToCover) {
    overlayDynamicClasses = 'w-full left-0 rounded-2xl';
  } else {
    if (activePanel === 'signIn') {
      overlayDynamicClasses = 'w-1/2 left-0 rounded-l-2xl rounded-r-[150px]';
    } else {
      overlayDynamicClasses = 'w-1/2 left-[50%] rounded-r-2xl rounded-l-[150px]';
    }
  }
  const signUpFormBaseClasses = `absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center items-center p-6 sm:p-10 text-center transition-all ${DURATION_CLASS} ease-in-out`;
  let signUpFormDynamicClasses = '';
  if (activePanel === 'signUp' && !animateToCover) {
    signUpFormDynamicClasses = 'opacity-100 z-10 translate-x-0';
  } else {
    signUpFormDynamicClasses = 'opacity-0 z-0 -translate-x-full pointer-events-none';
  }
  const signInFormBaseClasses = `absolute top-0 left-1/2 w-1/2 h-full flex flex-col justify-center items-center p-6 sm:p-10 text-center transition-all ${DURATION_CLASS} ease-in-out`;
  let signInFormDynamicClasses = '';
  if (activePanel === 'signIn' && !animateToCover) {
    signInFormDynamicClasses = 'opacity-100 z-10 translate-x-0';
  } else {
    signInFormDynamicClasses = 'opacity-0 z-0 translate-x-full pointer-events-none';
  }
  const overlayContentBaseClasses = `absolute inset-0 flex flex-col justify-center items-center p-6 sm:p-10 text-center transition-all ${DURATION_CLASS} ease-in-out`;

  let signInPromptTextClasses = overlayContentBaseClasses;
  if (activePanel === 'signIn') {
    signInPromptTextClasses += animateToCover ? ' opacity-0 -translate-x-[20%]' : ' opacity-100 translate-x-0';
  } else {
    signInPromptTextClasses += ' opacity-0 translate-x-[20%] pointer-events-none';
  }
  let signUpPromptTextClasses = overlayContentBaseClasses;
  if (activePanel === 'signUp') {
    signUpPromptTextClasses += animateToCover ? ' opacity-0 translate-x-[20%]' : ' opacity-100 translate-x-0';
  } else {
    signUpPromptTextClasses += ' opacity-0 -translate-x-[20%] pointer-events-none';
  }

  return (
    <div className="bg-white w-[900px] max-w-[95vw] min-h-[550px] sm:h-[550px] rounded-2xl shadow-2xl relative overflow-hidden">
      <button onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-40"
        aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Sign Up Form Panel */}
      <div className={`${signUpFormBaseClasses} ${signUpFormDynamicClasses}`}>
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">Create Account</h1>
        <form onSubmit={handleSignUpSubmit} className="w-full max-w-xs">
          <InputField
            type="text"
            placeholder="Username"
            required
            icon={<UserIcon className={commonIconClass} />}
            value={signUpUsername}
            onChange={e => setSignUpUsername(e.target.value)}
            aria-label="Username"
          />
          <InputField
            type="email"
            placeholder="Email"
            required
            icon={<EmailIcon className={commonIconClass} />}
            value={signUpEmail}
            onChange={e => setSignUpEmail(e.target.value)}
            aria-label="Email"
          />
          <InputField
            type="password"
            placeholder="Password"
            required
            icon={<LockIcon className={commonIconClass} />}
            value={signUpPassword}
            onChange={e => setSignUpPassword(e.target.value)}
            aria-label="Password"
          />
          <button type="submit" className="w-full bg-indigo-500 text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition-colors mt-2">
            Sign Up
          </button>
        </form>
        {errorMsg && <div className="text-red-500 mt-2">{errorMsg}</div>}
        <p className="text-gray-500 text-sm mt-6 mb-3">or sign up with</p>
        <SocialIcons onGoogleSignIn={handleGoogleSignIn} />
      </div>

      {/* Sign In Form Panel */}
      <div className={`${signInFormBaseClasses} ${signInFormDynamicClasses}`}>
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">Sign In</h1>
        <form onSubmit={handleSignInSubmit} className="w-full max-w-xs">
          <InputField
            type="email"
            placeholder="Email"
            required
            icon={<EmailIcon className={commonIconClass} />}
            value={signInEmail}
            onChange={e => setSignInEmail(e.target.value)}
            aria-label="Email"
          />
          <InputField
            type="password"
            placeholder="Password"
            required
            icon={<LockIcon className={commonIconClass} />}
            value={signInPassword}
            onChange={e => setSignInPassword(e.target.value)}
            aria-label="Password"
          />
          <a href="#" className="text-xs text-gray-500 hover:text-indigo-500 my-3 block">Forgot your password?</a>
          <button type="submit" className="w-full bg-indigo-500 text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition-colors">
            Sign In
          </button>
        </form>
        {errorMsg && <div className="text-red-500 mt-2">{errorMsg}</div>}
        <p className="text-gray-500 text-sm mt-6 mb-3">or sign in with</p>
        <SocialIcons onGoogleSignIn={handleGoogleSignIn} />
      </div>

      {/* Overlay Container */}
      <div className={`${overlayBaseClasses} ${overlayDynamicClasses}`}>
        <div className={signInPromptTextClasses}>
          <h2 className="text-3xl font-bold mb-3">Hello, Friend!</h2>
          <p className="text-sm mb-6 leading-relaxed max-w-xs">
            Enter your personal details and start your journey with us
          </p>
          <button
            onClick={() => handleTogglePanel('signUp')}
            disabled={isAnimating}
            className="px-8 py-3 border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-indigo-500 transition-all duration-300 disabled:opacity-50"
          >
            Sign Up
          </button>
        </div>
        <div className={signUpPromptTextClasses}>
          <h2 className="text-3xl font-bold mb-3">Welcome Back!</h2>
          <p className="text-sm mb-6 leading-relaxed max-w-xs">
            To keep connected with us please login with your personal info
          </p>
          <button
            onClick={() => handleTogglePanel('signIn')}
            disabled={isAnimating}
            className="px-8 py-3 border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-indigo-500 transition-all duration-300 disabled:opacity-50"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;

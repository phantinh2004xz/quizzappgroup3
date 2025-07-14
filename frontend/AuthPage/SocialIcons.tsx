import React from 'react';
import { GoogleIcon, FacebookIcon, GithubIcon, LinkedInIcon } from './Icons';

interface SocialIconsProps {
  onGoogleSignIn?: () => void;
}

const SocialIcons: React.FC<SocialIconsProps> = ({ onGoogleSignIn }) => {
  const iconClasses = "w-5 h-5";
  const linkClasses = "inline-flex items-center justify-center w-10 h-10 border border-gray-300 rounded-full hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300 mx-1.5 group";

  return (
    <div className="flex justify-center my-4">
      <button onClick={onGoogleSignIn} aria-label="Login with Google" className={linkClasses} type="button">
        <GoogleIcon className={`${iconClasses} text-gray-700 group-hover:scale-110 transition-transform duration-300`} />
      </button>
      <button disabled aria-label="Login with Facebook" className={linkClasses} type="button">
        <FacebookIcon className={`${iconClasses} text-gray-700 group-hover:scale-110 transition-transform duration-300`} />
      </button>
      <button disabled aria-label="Login with Github" className={linkClasses} type="button">
        <GithubIcon className={`${iconClasses} text-gray-700 group-hover:scale-110 transition-transform duration-300`} />
      </button>
      <button disabled aria-label="Login with LinkedIn" className={linkClasses} type="button">
        <LinkedInIcon className={`${iconClasses} text-gray-700 group-hover:scale-110 transition-transform duration-300`} />
      </button>
    </div>
  );
};

export default SocialIcons;

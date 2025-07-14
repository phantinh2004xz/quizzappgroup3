import React from 'react';
import Navbar from './Navbar'; 
import HeroSection from './HeroSection';
import FeatureSection from './FeatureSection';
import Footer from './Footer';

interface HomePageProps {
  onAuthClick: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onAuthClick }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onAuthClick={onAuthClick} />
      <main className="flex-grow">
        <HeroSection />
        <FeatureSection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
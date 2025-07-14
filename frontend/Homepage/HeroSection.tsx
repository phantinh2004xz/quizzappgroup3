import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white py-20 md:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
          QuizSpark: <span className="block sm:inline">Ignite Your Knowledge!</span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-sky-100 max-w-2xl mx-auto mb-10 leading-relaxed">
          Create, share, and conquer quizzes with ease. Our platform offers intuitive tools for learning and assessment.
        </p>
        <a
          href="#"
          className="inline-block bg-white text-sky-600 hover:bg-sky-50 font-semibold text-lg px-10 py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50"
          aria-label="Get Started with QuizSpark"
        >
          Get Started
        </a>
      </div>
    </section>
  );
};

export default HeroSection;

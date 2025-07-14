import React from 'react';
import FeatureCard from './FeatureCard';
import { PencilSquareIcon, CheckBadgeIcon, ChartBarIcon, SquaresPlusIcon } from './Icons';

const features = [
  {
    icon: <PencilSquareIcon />,
    title: 'Easy Quiz Creation',
    description: 'Craft engaging quizzes in minutes with our user-friendly interface and diverse question types.',
  },
  {
    icon: <CheckBadgeIcon />,
    title: 'Automatic Grading',
    description: 'Save time with instant results and automated scoring for all your quizzes, providing immediate feedback.',
  },
  {
    icon: <ChartBarIcon />,
    title: 'Performance Analytics',
    description: 'Track progress, identify strengths, and pinpoint areas for improvement with insightful visual reports.',
  },
  {
    icon: <SquaresPlusIcon />,
    title: 'Diverse Question Types',
    description: 'Support for multiple choice, true/false, fill-in-the-blanks, matching, and more to suit all needs.',
  },
];

const FeatureSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4 tracking-tight">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            QuizSpark provides powerful features to enhance learning and assessment for educators and learners alike.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;

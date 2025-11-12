// src/components/common/Card.jsx
import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  ...props 
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' } : {}}
      className={`
        bg-white rounded-xl shadow-md p-6
        transition-all duration-200
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
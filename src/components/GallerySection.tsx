import React from 'react';
import { motion } from 'framer-motion';

const GallerySection = () => {
  const images = [
    { src: '/lovable-uploads/fire-over-city.png', alt: 'Retsba breathing fire over city' },
    { src: '/lovable-uploads/field-of-bones.png', alt: 'Retsba in field of bones' },
    { src: '/lovable-uploads/eating-dinner.png', alt: 'Retsba dining' },
    { src: '/lovable-uploads/caught-a-lil.jpg', alt: 'Retsba with victim' },
    { src: '/lovable-uploads/brute-force.png', alt: 'Retsba showing power' },
    { src: '/lovable-uploads/lava-throw.jpg', alt: 'Retsba throwing into lava' },
  ];

  return (
    <section className="py-20 bg-retsba relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {images.map((image, index) => (
            <motion.div
              key={index}
              className="relative overflow-hidden rounded-lg villain-shadow hover-float"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover aspect-square"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;

import React, { useState } from 'react';

interface LandingPageProps {
  onExplore: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onExplore }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const scrollToSlide = (index: number) => {
    setActiveSlide(index);
    const element = document.getElementById(`slide-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full h-screen overflow-y-auto snap-y snap-mandatory bg-black text-white">
      {/* Fixed Top Navigation Bar matching index.html */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSlide(0)}>
          <span className="font-extrabold text-2xl tracking-wider text-white">MSLAT</span>
        </div>
        <ul className="hidden md:flex items-center space-x-8 text-sm uppercase tracking-wider font-medium text-gray-300">
          <li><button onClick={() => scrollToSlide(0)} className="hover:text-white transition-colors">Home</button></li>
          <li><button onClick={() => scrollToSlide(1)} className="hover:text-white transition-colors">About</button></li>
          <li><button onClick={() => scrollToSlide(2)} className="hover:text-white transition-colors">Vision</button></li>
          <li><button onClick={() => scrollToSlide(3)} className="hover:text-white transition-colors">Case study</button></li>
          <li><button onClick={() => scrollToSlide(4)} className="hover:text-white transition-colors">Technology</button></li>
          <li><button onClick={() => scrollToSlide(5)} className="hover:text-white transition-colors">Contact Us</button></li>
        </ul>
        <button
          onClick={onExplore}
          className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-blue-600/30"
        >
          Explore App
        </button>
      </nav>

      {/* Floating Side Slide Indicator Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col space-y-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => scrollToSlide(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              activeSlide === i ? 'bg-blue-500 scale-125 ring-4 ring-blue-500/30' : 'bg-white/40 hover:bg-white/70'
            }`}
            title={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slide 1 (#09) - Hero Front Page */}
      <section
        id="slide-0"
        className="relative w-full h-screen snap-start flex items-center justify-center px-8 bg-cover bg-center"
        style={{ backgroundImage: `url('/assets/img/background/img10.png')` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-4xl text-center space-y-6">
          <h1 className="gradient-text mx-auto select-none">MSLAT</h1>
          <p className="text-xl sm:text-2xl text-gray-200 font-light opacity-90 max-w-2xl mx-auto">
            Share moments that matter with the ones you cherish
          </p>
          <div className="pt-4">
            <button
              onClick={onExplore}
              className="content-button text-xl px-12 py-4"
            >
              Explore !
            </button>
          </div>
        </div>
      </section>

      {/* Slide 2 (#15) - About */}
      <section
        id="slide-1"
        className="relative w-full h-screen snap-start flex items-center px-8 sm:px-20 bg-cover bg-center"
        style={{ backgroundImage: `url('/assets/img/background/img2.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-2xl text-left space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Malayalam Sign Language Automatic Translator
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed font-light">
            The main goal of this project is to develop a software application to recognize and translate Malayalam sign language.
          </p>
          <p className="text-lg text-gray-200">
            <strong className="text-blue-400 font-bold">MSLAT</strong> is a real-time software that is able to recognize Malayalam Sign language hand gestures.
          </p>
          <div className="pt-2">
            <button
              onClick={onExplore}
              className="content-button"
            >
              Explore !
            </button>
          </div>
        </div>
      </section>

      {/* Slide 3 (#14) - Vision */}
      <section
        id="slide-2"
        className="relative w-full h-screen snap-start flex items-center px-8 sm:px-20 bg-cover bg-center"
        style={{ backgroundImage: `url('/assets/img/background/img12.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-2xl text-left space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Our Vision
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed font-light">
            <strong className="text-blue-400 font-bold">MSLAT</strong> offers solutions that allow the Deaf to communicate with other people easily and effectively – anytime and anywhere.
          </p>
          <div className="pt-2">
            <button
              onClick={onExplore}
              className="content-button"
            >
              Explore !
            </button>
          </div>
        </div>
      </section>

      {/* Slide 4 (#89) - Case Study */}
      <section
        id="slide-3"
        className="relative w-full h-screen snap-start flex items-center px-8 sm:px-16 bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url('/assets/img/background/img11.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/75" />
        <div className="relative z-10 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs uppercase tracking-widest text-blue-400 font-bold">Case study</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">In Kerala</h1>
            <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed">
              There are nearly 5.5 million people with hearing and speaking disabilities, and people utilizing sign language to communicate with these communities are very less.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <h3 className="font-semibold text-white text-sm mb-1 text-blue-300">Easy to use</h3>
                <p className="text-xs text-gray-400">Users of any age group can use - children, schools & college students, adults and elderly.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <h3 className="font-semibold text-white text-sm mb-1 text-blue-300">Device-agnostic</h3>
                <p className="text-xs text-gray-400">Works on virtually any device with browser, camera and basic processing power.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <h3 className="font-semibold text-white text-sm mb-1 text-blue-300">Supports dialects</h3>
                <p className="text-xs text-gray-400">Can understand various dialects of sign language used and also easily extendable.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <h3 className="font-semibold text-white text-sm mb-1 text-blue-300">Real-time and fast</h3>
                <p className="text-xs text-gray-400">Each gesture interpretation takes only a few milliseconds with minimal power.</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 hidden lg:flex flex-col space-y-4">
            <img
              src="/assets/img/img8.jpg"
              alt="Case study presentation"
              className="rounded-2xl shadow-2xl border border-white/10 max-h-48 object-cover w-full"
            />
            <img
              src="/assets/img/img7.jpg"
              alt="Case study reference"
              className="rounded-2xl shadow-2xl border border-white/10 max-h-48 object-cover w-full"
            />
          </div>
        </div>
      </section>

      {/* Slide 5 (#15) - Technology */}
      <section
        id="slide-4"
        className="relative w-full h-screen snap-start flex items-center px-8 sm:px-20 bg-cover bg-center"
        style={{ backgroundImage: `url('/assets/img/background/img9.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-2xl text-left space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Technology
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed font-light">
            Sign Language is a complex and nuanced language that consists of different elements. MSLAT has developed technology combining computer vision, machine learning, and natural-language processing algorithms.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onExplore}
              className="content-button"
            >
              Explore !
            </button>
            <a
              href="https://google.github.io/mediapipe/solutions/hands.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full border border-white/30 text-white hover:bg-white/10 text-sm font-semibold transition-all inline-flex items-center"
            >
              Learn more about MediaPipe
            </a>
          </div>
        </div>
      </section>

      {/* Slide 6 (#95) - Contact Us */}
      <section
        id="slide-5"
        className="relative w-full h-screen snap-start flex flex-col justify-between p-8 sm:p-20 bg-cover bg-center"
        style={{ backgroundImage: `url('/assets/img/background/img13.avif')` }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 max-w-xl mx-auto my-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Get in Touch with Us
          </h1>
          <p className="text-gray-300 font-light">
            We are constantly trying to improve.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); alert('Thank you for reaching out!'); }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="E-mail address"
              required
              className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 text-sm"
            />
            <button
              type="submit"
              className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg"
            >
              Send
            </button>
          </form>
        </div>
        <div className="relative z-10 text-center text-xs text-gray-400 border-t border-white/10 pt-4">
          Made with love from CET &bull; &copy; MSLAT
        </div>
      </section>
    </div>
  );
};


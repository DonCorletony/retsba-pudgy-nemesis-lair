import NavBar from "@/components/NavBar";

const Memes = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      <NavBar />
      <div className="container mx-auto px-4 pt-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8">
            RETSBA Memes
          </h1>
          <p className="text-xl text-gray-300 mb-12">
            The dankest memes in the crypto space
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-white text-xl font-bold mb-2">To the Moon!</h3>
              <p className="text-gray-400">When RETSBA hits different</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">💎</div>
              <h3 className="text-white text-xl font-bold mb-2">Diamond Hands</h3>
              <p className="text-gray-400">HODL RETSBA forever</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">🔥</div>
              <h3 className="text-white text-xl font-bold mb-2">This is Fine</h3>
              <p className="text-gray-400">Me watching the charts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Memes;
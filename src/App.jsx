import Header from "./componets/Header/Header";
import Hero from "./componets/Hero/Hero"
import ProjetosSection from "./componets/Projetos/ProjetosSection";
import Footer from "./componets/Footer/Footer";
import Sobre from "./componets/Sobre/Sobre";

function App() {
  return (
    <>
      <Header />
      <main >
       <Hero />
       <ProjetosSection/>
       <Sobre />
      </main>
      <Footer />
    </>
  );
}

export default App;
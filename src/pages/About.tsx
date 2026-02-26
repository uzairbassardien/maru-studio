import aboutImage from "@/assets/about.png";

const About = () => {
  return (
    <div className="px-6 md:px-12 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif text-4xl md:text-6xl tracking-wide text-center mb-16 animate-fade-in">
          Simplicity is Strength.
        </h1>

        <div className="mb-16 animate-fade-in-delay">
          <img
            src={aboutImage}
            alt="Maru by Maru — craftsmanship"
            className="w-full object-cover grayscale"
          />
        </div>

        <div className="max-w-xl mx-auto space-y-8 animate-fade-in-delay-2">
          <p className="font-serif text-xl md:text-2xl tracking-wide leading-relaxed text-center">
            Maru by Maru was founded on a single belief: that true elegance lives in restraint.
          </p>
          <p className="text-sm leading-relaxed text-center">
            Every piece begins with a silhouette — refined, considered, and free from excess.
            We work with the finest fabrics to create dresses that feel as timeless as they look.
          </p>
          <p className="text-sm leading-relaxed text-center">
            Our collections are designed for women who understand that presence needs no embellishment.
            Each garment is a quiet statement — modern femininity expressed through craft,
            quality, and the confidence of simplicity.
          </p>
          <p className="text-sm leading-relaxed text-center text-muted-foreground">
            Made with intention. Worn with presence.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;

import { Github, Linkedin, Mail, Instagram } from 'lucide-react'
import './Footer.css'

const INFO = {
  nom: "Aghiles Ait Belkacem",
  role: "Full Stack developer",
  github: "https://github.com/aghilesaitbelkacem-lab",
  linkedin: "https://www.linkedin.com/in/aghiles-aitbelkacem-52a54b394/",
  email: "aghilesaitbelkacem@gmail.com",
  instagram: "https://www.instagram.com/aghiles.ss/"
}


export default function Footer() {
  const annee = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <span className="footer-nom">{INFO.nom}</span>
          {INFO.role && <span className="footer-role">{INFO.role}</span>}
        </div>

        <nav className="footer-links" aria-label="Mes liens">
          {INFO.github && (
            <a href={INFO.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github size={18} />
            </a>
          )}
          {INFO.linkedin && (
            <a href={INFO.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin size={18} />
            </a>
          )}
          {INFO.email && (
            <a href={`mailto:${INFO.email}`} aria-label="Email">
              <Mail size={18} />
            </a>
          )}
         
          {INFO.instagram && (
            <a href={INFO.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram size={18} />
            </a>
          )}
        </nav>

        <div className="footer-copy">
          © {annee} {INFO.nom}. Tous droits réservés.
        </div>

      </div>
    </footer>
  )
}

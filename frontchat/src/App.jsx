import './App.css'
import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import Footer from './Footer'

const SYSTEM_PROMPT = {
  role: "system",
  content: "Tu es un assistant IA spécialisé dans le rap (français, américain et international). Tu possèdes une très grande culture du rap : artistes, albums, mixtapes, labels, producteurs, histoires du mouvement, clashs, chiffres de ventes, certifications, tendances, paroles, techniques d'écriture, et actualité du rap. Pour chaque question, effectue une recherche et une analyse approfondies afin de fournir la réponse la plus précise, fiable et pertinente possible. Vérifie les informations importantes et évite les approximations. Tes réponses doivent être avant tout utiles et pertinentes, pas simplement longues. Adapte la longueur de la réponse à la question , Question simple → réponse concise et directe. Question complexe → réponse détaillée et structurée. Comparaison ou débat → analyse équilibrée avec arguments et contexte. Lorsque plusieurs réponses sont possibles, explique laquelle est la plus probable ou la plus reconnue et pourquoi. Tu dois également être capable d'expliquer les références, les punchlines, les doubles sens, les clashs, les influences musicales et le contexte culturel derrière les morceaux et les artistes. Si une information est incertaine ou controversée, indique clairement le niveau de certitude au lieu de présenter une supposition comme un fait. Ton objectif est de fournir la meilleure réponse possible à chaque question sur le rap, avec précision, clarté et pertinence, sans blabla inutile RÈGLE ABSOLUE : Ne jamais inventer d'informations. Si tu ne connais pas une information avec certitude, dis-le explicitement. Ne jamais inventer des dates de sortie, des chiffres de ventes, des certifications, des classements, des paroles ou des collaborations. Il est préférable de répondre « Je ne sais pas » plutôt que de fournir une information potentiellement fausse, choisis l'info la plus récente selon les dates, et méfie-toi des pages encyclopédiques qui peuvent décrire un projet plus ancien ."
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState(
    ()=> localStorage.getItem('theme') || 'dark'
    )

    useEffect(() => {
      document.documentElement.setAttribute('data-theme',theme)
      localStorage.setItem('theme', theme)
    },[theme])

    const toggleTheme = () => {
      setTheme(t => (t === 'dark' ? 'light' : 'dark'))
    }

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { role: "user", content: input }
    const updatedMessages = [...messages, userMessage]

   
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [SYSTEM_PROMPT, ...updatedMessages]
        })
      })

      if (!res.ok) {
        throw new Error(`Le serveur a répondu ${res.status}`)
      }

      // Lecture de la réponse en streaming (texte brut, morceau par morceau)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ""
      let started = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        acc += decoder.decode(value, { stream: true })

        if (!started) {
          started = true
          setLoading(false)
        }

        setMessages([...updatedMessages, { role: "assistant", content: acc }])
      }
    } catch (err) {
      console.error(err)
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: `⚠️ Erreur : ${err.message}. Vérifie que le backend tourne sur le port 5000.` }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Réinitialise la conversation pour repartir de zéro
  const resetConversation = () => {
    setMessages([])
    setInput("")
    setLoading(false)
  }

  return (
    <>
    <div className="chat-container">
      <header className="chat-header">
        <span className="logo">RapBot</span>
        <button className="reset-btn" onClick={resetConversation}>
            Nouveau
        </button>
        <button className="theme-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} color='#fff'/> : <Moon size={18} />}
        </button>
      </header>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="placeholder">Yo, envoie un message pour commencer...</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="bubble">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Tape ton message..."
        />
        <button onClick={sendMessage} disabled={loading}>
          Envoyer
        </button>
      </div>
    </div>
    
    <Footer />
    </>
  )

}
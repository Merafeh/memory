import { useState } from "react";
import API from "../services/api"; // Importer l'instance Axios

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await API.post("/login", { email, password });
            localStorage.setItem("token", response.data.token); // Stocke le JWT
            alert("Connexion réussie !");
        } catch (err) {
            setError("Email ou mot de passe incorrect");
        }
    };

    return (
        <div className="form-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input 
                    className="blur-input" 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                />
                <input 
                    className="blur-input" 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                />
                <button type="submit">Log In</button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <p>Don't have an account?<br /><a href="/Register">Register</a></p>
        </div>
    );
}

export default Login;

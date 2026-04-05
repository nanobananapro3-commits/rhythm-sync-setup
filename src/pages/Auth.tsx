import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else navigate('/');
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setError(error.message);
      else setMessage('¡Revisa tu correo para confirmar tu cuenta!');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message || 'Error al iniciar sesión con Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="font-display text-4xl sm:text-6xl font-black text-primary text-glow-primary tracking-wider">GEOMETRY</h1>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-accent tracking-wider -mt-1">MUSIC</h1>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-secondary text-glow-secondary tracking-wider -mt-1">DASH</h1>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4 p-6 rounded-lg neon-border">
        <h2 className="font-display text-xl text-primary text-center">
          {isLogin ? 'INICIAR SESIÓN' : 'REGISTRARSE'}
        </h2>

        <Button
          variant="neon-outline"
          size="lg"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full"
        >
          🔵 Continuar con Google
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-muted-foreground/30" />
          <span className="text-muted-foreground text-xs font-body">o</span>
          <div className="flex-1 h-px bg-muted-foreground/30" />
        </div>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="bg-background/50 border-primary/30 text-foreground"
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-background/50 border-primary/30 text-foreground"
          />
          <Button variant="neon" size="lg" type="submit" disabled={loading}>
            {loading ? '...' : isLogin ? '▶ ENTRAR' : '✦ CREAR CUENTA'}
          </Button>
        </form>

        {error && <p className="text-destructive text-sm font-body text-center">{error}</p>}
        {message && <p className="text-accent text-sm font-body text-center">{message}</p>}

        <button
          onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
          className="text-muted-foreground text-sm font-body hover:text-primary transition-colors"
        >
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-muted-foreground/30" />
          <span className="text-muted-foreground text-xs font-body">o</span>
          <div className="flex-1 h-px bg-muted-foreground/30" />
        </div>

        <Button
          variant="neon-secondary"
          size="lg"
          onClick={() => navigate('/')}
          className="w-full"
        >
          🎮 Jugar sin cuenta
        </Button>
        <p className="text-xs text-destructive font-body text-center animate-pulse">
          ⚠️ Tu progreso no se guardará si sales
        </p>
      </div>
    </div>
  );
};

export default Auth;

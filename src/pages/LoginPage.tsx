import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Church } from 'lucide-react';
import { supabase } from '../lib/supabase';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export function LoginPage() {
    const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      if (authData.user) {
        // Login bem sucedido - navegar para dashboard
        navigate('/');
      }
    } catch (err: any) {
      console.error('Erro no login:', err);
      alert(err.message || 'Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Coluna da Esquerda (Branding) */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-blue-800 p-12 text-white">
          <Church className="h-24 w-24 mb-4" />
          <h1 className="text-3xl font-bold">PrestFlow</h1>
          <p className="mt-2 text-center text-blue-200">Gestão e comunicação para sua igreja.</p>
        </div>

        {/* Coluna da Direita (Formulário) */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Bem-vindo de volta!</h2>
            <p className="mt-2 text-gray-600">Faça login para acessar seu painel.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <Mail className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
              <input
                {...register('email')}
                type="email"
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div className="relative">
              <Lock className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
              <input
                {...register('password')}
                type="password"
                placeholder="Senha"
                className="w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
                        <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Entrar
            </button>
          </form>
          <p className="mt-8 text-sm text-center text-gray-600">
            Não tem uma conta?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Church, MessageSquare, Calendar, Users, Bot, Bed } from 'lucide-react';
import { supabase } from '../lib/supabase';

const loginSchema = z.object({
  email: z.string().min(1, { message: 'Email é obrigatório.' }).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Por favor, insira um email válido.' }),
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
        navigate('/');
      }
    } catch (err: any) {
      console.error('Erro no login:', err);
      alert(err.message || 'Erro ao fazer login');
    }
  };

  const features = [
    { icon: Bot, text: 'Atendimento com IA' },
    { icon: MessageSquare, text: 'WhatsApp Integrado' },
    { icon: Calendar, text: 'Agendamentos' },
    { icon: Users, text: 'Gestão de Membros' },
    { icon: Bed, text: 'Hospedagem' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="flex w-full max-w-5xl mx-4 bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
        {/* Coluna da Esquerda (Branding) */}
        <div className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-gradient-to-br from-purple-600 to-indigo-700 p-12 text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full"></div>
            <div className="absolute bottom-20 right-10 w-48 h-48 border border-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 border border-white rounded-full"></div>
          </div>
          
          <div className="relative z-10 text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 mb-6 inline-block">
              <Church className="h-16 w-16" />
            </div>
            <h1 className="text-4xl font-bold mb-2">LogiKon</h1>
            <p className="text-purple-200 text-lg mb-8">Sistema de Gestão para Igrejas</p>
            
            <div className="space-y-4 text-left">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <feature.icon className="h-5 w-5 text-yellow-300" />
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
            
            <p className="mt-8 text-sm text-purple-200/80">
              Automatize o atendimento, gerencie eventos e conecte-se com seus fiéis de forma inteligente.
            </p>
          </div>
        </div>

        {/* Coluna da Direita (Formulário) */}
        <div className="w-full lg:w-1/2 p-8 md:p-12">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="bg-purple-600 rounded-full p-4 inline-block mb-4">
              <Church className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Acesse o LogiKon</h1>
            <p className="text-gray-400 text-sm">Sistema de Gestão para Igrejas</p>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">Bem-vindo de volta!</h2>
            <p className="mt-2 text-gray-400">Faça login para acessar seu painel.</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative">
              <Mail className="absolute w-5 h-5 text-gray-500 left-4 top-1/2 -translate-y-1/2" />
              <input
                {...register('email')}
                type="email"
                placeholder="Email"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
            </div>
            
            <div className="relative">
              <Lock className="absolute w-5 h-5 text-gray-500 left-4 top-1/2 -translate-y-1/2" />
              <input
                {...register('password')}
                type="password"
                placeholder="Senha"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          
          <p className="mt-8 text-sm text-center text-gray-400">
            Não tem uma conta?{' '}
            <Link to="/register" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
              Cadastre-se gratuitamente
            </Link>
          </p>
          
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-xs text-center text-gray-500">
              © 2024 PrestFlow. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

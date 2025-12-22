import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Church, CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

const registerSchema = z.object({
  churchName: z.string().min(3, { message: 'O nome da igreja deve ter pelo menos 3 caracteres.' }),
  userName: z.string().min(3, { message: 'Seu nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().min(1, { message: 'Email é obrigatório.' }).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.userName,
            church_name: data.churchName,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      await supabase.auth.signOut();

      alert('Cadastro realizado com sucesso! Você já pode fazer login.');
      navigate('/login');

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      alert(error.message || 'Erro ao realizar cadastro. Tente novamente.');
    }
  };

  const benefits = [
    'Atendimento automatizado com IA',
    'Integração com WhatsApp',
    'Gestão de agendamentos e eventos',
    'Sistema de hospedagem completo',
    'Formulários de visitação',
    'Relatórios e análises',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="flex w-full max-w-5xl mx-4 bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
        {/* Coluna da Esquerda (Branding) */}
        <div className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-gradient-to-br from-purple-600 to-indigo-700 p-10 text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full"></div>
            <div className="absolute bottom-20 right-10 w-48 h-48 border border-white rounded-full"></div>
          </div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-5 mb-4 inline-block">
                <Church className="h-12 w-12" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Cadastre sua Igreja no LogiKon</h1>
              <p className="text-gray-400">Preencha os dados para começar</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <span className="font-semibold">Tudo que sua igreja precisa:</span>
              </div>
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm text-purple-100">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="mt-6 text-xs text-center text-purple-200/70">
              Junte-se a centenas de igrejas que já usam o PrestFlow
            </p>
          </div>
        </div>

        {/* Coluna da Direita (Formulário) */}
        <div className="w-full lg:w-1/2 p-8 md:p-10">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-6">
            <div className="bg-purple-600 rounded-full p-3 inline-block mb-3">
              <Church className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">PrestFlow</h1>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Crie sua conta grátis</h2>
            <p className="mt-2 text-gray-400 text-sm">Comece a gerenciar sua igreja hoje mesmo.</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Church className="absolute w-5 h-5 text-gray-500 left-4 top-1/2 -translate-y-1/2" />
              <input
                {...register('churchName')}
                type="text"
                placeholder="Nome da Igreja"
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.churchName && <p className="mt-1 text-sm text-red-400">{errors.churchName.message}</p>}
            </div>
            
            <div className="relative">
              <User className="absolute w-5 h-5 text-gray-500 left-4 top-1/2 -translate-y-1/2" />
              <input
                {...register('userName')}
                type="text"
                placeholder="Seu Nome"
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.userName && <p className="mt-1 text-sm text-red-400">{errors.userName.message}</p>}
            </div>
            
            <div className="relative">
              <Mail className="absolute w-5 h-5 text-gray-500 left-4 top-1/2 -translate-y-1/2" />
              <input
                {...register('email')}
                type="email"
                placeholder="Email"
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
            </div>
            
            <div className="relative">
              <Lock className="absolute w-5 h-5 text-gray-500 left-4 top-1/2 -translate-y-1/2" />
              <input
                {...register('password')}
                type="password"
                placeholder="Senha (mínimo 6 caracteres)"
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              {isSubmitting ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>
          
          <p className="mt-6 text-sm text-center text-gray-400">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
              Faça login
            </Link>
          </p>
          
          <p className="mt-4 text-xs text-center text-gray-500">
            Ao criar uma conta, você concorda com nossos termos de uso e política de privacidade.
          </p>
          
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-xs text-center text-gray-500">
              © 2024 LogiKon. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

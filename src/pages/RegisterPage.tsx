import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Church } from 'lucide-react';
import { supabase } from '../lib/supabase';

const registerSchema = z.object({
  churchName: z.string().min(3, { message: 'O nome da igreja deve ter pelo menos 3 caracteres.' }),
  userName: z.string().min(3, { message: 'Seu nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
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
      // Criar usuário no Supabase Auth com metadata
      // O trigger SQL vai criar a igreja e o perfil automaticamente
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

      // Aguardar um pouco para o trigger SQL finalizar
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fazer logout para que o usuário faça login manualmente
      await supabase.auth.signOut();

      alert('Cadastro realizado com sucesso! Você já pode fazer login.');
      navigate('/login');

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      alert(error.message || 'Erro ao realizar cadastro. Tente novamente.');
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
            <h2 className="text-3xl font-bold text-gray-800">Crie sua conta</h2>
            <p className="mt-2 text-gray-600">Comece a gerenciar sua igreja hoje mesmo.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <Church className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
              <input
                {...register('churchName')}
                type="text"
                placeholder="Nome da Igreja"
                className="w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              {errors.churchName && <p className="mt-1 text-sm text-red-600">{errors.churchName.message}</p>}
            </div>
            <div className="relative">
              <User className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
              <input
                {...register('userName')}
                type="text"
                placeholder="Seu Nome"
                className="w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              {errors.userName && <p className="mt-1 text-sm text-red-600">{errors.userName.message}</p>}
            </div>
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
              Cadastrar
            </button>
          </form>
          <p className="mt-8 text-sm text-center text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

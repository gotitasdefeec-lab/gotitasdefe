'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomer } from '@/context/CustomerContext';
import toast from 'react-hot-toast';
import { UserIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const router = useRouter();
  const { register } = useCustomer();
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const isEmailValid = email.includes('@') && email.includes('.') && email.length > 5;
  const isPasswordValid = password.length >= 6;
  const isNameValid = name.length > 2;
  const isConfirmValid = confirmPassword === password && confirmPassword.length > 0;

  const canSubmit = isNameValid && isEmailValid && isPasswordValid && isConfirmValid && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmTouched(true);
    if (!canSubmit) return;
    setLoading(true);
    try {
      await register({ name, email, password });
      toast.success('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
      router.push('/login');
    } catch (err: any) {
      // Show specific error for duplicate email or fallback
      if (err.message === 'El correo ya está registrado.') {
        setError('El correo ya está registrado.');
      } else {
        setError(err.message || 'Ocurrió un error durante el registro.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="bg-white rounded-full shadow-lg p-3 mb-2">
          <UserIcon className="h-10 w-10 text-blue-600" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 font-sans tracking-tight">
          Crear una nueva cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Inicia sesión aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-xl rounded-2xl sm:px-10 border border-blue-100">
          <form className="space-y-7" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                Nombre completo
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-blue-400" />
                </span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${nameTouched && !isNameValid ? 'border-red-400' : 'border-gray-300'} rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 sm:text-sm transition`}
                  placeholder="Tu nombre completo"
                  aria-invalid={nameTouched && !isNameValid}
                  aria-describedby="name-help"
                />
              </div>
              <p id="name-help" className="text-xs text-gray-500 mt-1">Debe tener al menos 3 caracteres.</p>
              {nameTouched && !isNameValid && <p className="text-xs text-red-500">Nombre muy corto.</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Correo electrónico
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-blue-400" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${emailTouched && !isEmailValid ? 'border-red-400' : 'border-gray-300'} rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 sm:text-sm transition`}
                  placeholder="ejemplo@email.com"
                  aria-invalid={emailTouched && !isEmailValid}
                  aria-describedby="email-help"
                />
              </div>
              <p id="email-help" className="text-xs text-gray-500 mt-1">Debe ser un correo válido.</p>
              {emailTouched && !isEmailValid && <p className="text-xs text-red-500">Correo inválido.</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-blue-400" />
                </span>
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border ${passwordTouched && !isPasswordValid ? 'border-red-400' : 'border-gray-300'} rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 sm:text-sm transition`}
                  placeholder="Mínimo 6 caracteres"
                  aria-invalid={passwordTouched && !isPasswordValid}
                  aria-describedby="password-help"
                />
                <button type="button" tabIndex={-1} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              <p id="password-help" className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres.</p>
              {passwordTouched && !isPasswordValid && <p className="text-xs text-red-500">Contraseña muy corta.</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                Confirmar contraseña
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-blue-400" />
                </span>
                <input
                  ref={confirmRef}
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border ${confirmTouched && !isConfirmValid ? 'border-red-400' : 'border-gray-300'} rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 sm:text-sm transition`}
                  placeholder="Repite la contraseña"
                  aria-invalid={confirmTouched && !isConfirmValid}
                  aria-describedby="confirm-help"
                />
                <button type="button" tabIndex={-1} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400" onClick={() => setShowConfirmPassword((v) => !v)} aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              <p id="confirm-help" className="text-xs text-gray-500 mt-1">Debe coincidir con la contraseña.</p>
              {confirmTouched && !isConfirmValid && <p className="text-xs text-red-500">Las contraseñas no coinciden.</p>}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 transition ${!canSubmit ? 'cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Creando cuenta...
                  </span>
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

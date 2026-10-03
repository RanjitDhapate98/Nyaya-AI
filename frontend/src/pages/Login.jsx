import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import { TextInput } from '../components/common/FormField';
import { Spinner } from '../components/common/Feedback';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(values.email)) errs.email = 'Enter a valid email address';
    if (!values.password) errs.password = 'Password is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setErrors({ password: err.status === 401 ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access the NyayaAI decision-support workspace."
      footer={<>New to NyayaAI? <Link to="/register" className="font-medium text-brass-600 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <TextInput label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={onChange} error={errors.email} required />
        <TextInput label="Password" name="password" type="password" autoComplete="current-password" value={values.password} onChange={onChange} error={errors.password} required />
        <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
          {submitting ? <Spinner className="h-4 w-4 text-white" /> : <LogIn className="h-4 w-4" />} Sign in
        </button>
      </form>
    </AuthShell>
  );
}

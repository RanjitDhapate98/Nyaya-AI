import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import { SelectInput, TextInput } from '../components/common/FormField';
import { Spinner } from '../components/common/Feedback';
import { useAuth } from '../context/AuthContext';
import { mapServerErrors } from '../utils/validation';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '', role: 'analyst' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (values.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(values.email)) e.email = 'Enter a valid email address';
    if (values.password.length < 8) e.password = 'At least 8 characters';
    else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) e.password = 'Include at least one letter and one number';
    if (values.confirm !== values.password) e.confirm = 'Passwords do not match';
    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      const { confirm, ...payload } = values;
      const user = await register(payload);
      toast.success(user.role === 'admin' ? 'Account created — you are the first user, so you are an admin.' : 'Account created');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors(mapServerErrors(err.details) || {});
      if (err.status === 409) setErrors({ email: err.message });
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Analysts can create cases and run predictions. Viewers have read-only access."
      footer={<>Already registered? <Link to="/login" className="font-medium text-brass-600 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <TextInput label="Full name" name="name" autoComplete="name" value={values.name} onChange={onChange} error={errors.name} required />
        <TextInput label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={onChange} error={errors.email} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Password" name="password" type="password" autoComplete="new-password" value={values.password} onChange={onChange} error={errors.password} hint="8+ chars, letter & number" required />
          <TextInput label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={values.confirm} onChange={onChange} error={errors.confirm} required />
        </div>
        <SelectInput label="Role" name="role" value={values.role} onChange={onChange} placeholder="Select role"
          options={[{ value: 'analyst', label: 'Analyst — create cases & run predictions' }, { value: 'viewer', label: 'Viewer — read-only' }]}
          hint="Admin roles are assigned by an existing admin." />
        <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
          {submitting ? <Spinner className="h-4 w-4 text-white" /> : <UserPlus className="h-4 w-4" />} Create account
        </button>
      </form>
    </AuthShell>
  );
}

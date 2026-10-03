import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { caseService } from '../services/caseService';
import { useAsync } from '../hooks/useAsync';
import CaseForm, { EMPTY_CASE, caseToForm } from '../components/cases/CaseForm';
import { AsyncBoundary } from '../components/common/Feedback';
import { PageHeader } from '../components/common/UI';
import { mapServerErrors } from '../utils/validation';

/** Handles both /cases/new and /cases/:id/edit */
export default function CreateCase() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const existing = useAsync(() => (isEdit ? caseService.get(id) : Promise.resolve(null)), [id]);

  const onSubmit = async (payload) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      const { case: saved } = isEdit ? await caseService.update(id, payload) : await caseService.create(payload);
      toast.success(isEdit ? 'Case updated. Re-run the prediction to refresh risk.' : 'Case saved');
      navigate(`/cases/${saved._id}`);
    } catch (err) {
      const mapped = mapServerErrors(err.details);
      if (err.status === 409 && err.details?.field) mapped[err.details.field] = err.message;
      setServerErrors(mapped);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={isEdit ? 'Edit case' : 'New case'}
        title={isEdit ? existing.data?.case?.caseNumber || 'Edit case' : 'Register a case'}
        subtitle="Fields marked * are required. Dates use the format YYYY-MM-DD."
      />
      <AsyncBoundary loading={existing.loading} error={existing.error} onRetry={existing.refetch}>
        <CaseForm
          key={existing.data?.case?._id || 'new'}
          initial={existing.data?.case ? caseToForm(existing.data.case) : EMPTY_CASE}
          onSubmit={onSubmit}
          submitting={submitting}
          serverErrors={serverErrors}
          submitLabel={isEdit ? 'Save changes' : 'Create case'}
        />
      </AsyncBoundary>
    </>
  );
}

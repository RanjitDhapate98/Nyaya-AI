import { Disclaimer, PageHeader } from '../components/common/UI';
import CasePicker from '../components/cases/CasePicker';

export default function SimilarHub() {
  return (
    <>
      <PageHeader eyebrow="Retrieval" title="Similar cases" subtitle="Find comparable matters by description, case type, legal sections, stage and court." />
      <div className="mb-6">
        <Disclaimer tone="info">
          Retrieval uses TF-IDF vectors with cosine similarity over the case database plus a synthetic historical sample corpus.
          The retriever is pluggable, so sentence-transformer embeddings or FAISS can replace it later.
        </Disclaimer>
      </div>
      <CasePicker title="Select a case" subtitle="Open a case to view or compute its most similar cases" linkSuffix="/similar" actionLabel="Similar" />
    </>
  );
}

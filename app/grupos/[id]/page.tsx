import { redirect } from 'next/navigation';

// Links antigos (já enviados no WhatsApp) continuam funcionando
export default function GrupoLegacyRedirect({ params }: { params: { id: string } }) {
  redirect(`/g/${params.id}`);
}

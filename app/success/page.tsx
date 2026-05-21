import SuccessView from './SuccessView'

interface SearchParams {
  payment_id?: string
  status?: string
  external_reference?: string
}

export default function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <SuccessView
      paymentId={searchParams.payment_id ?? null}
      status={searchParams.status ?? null}
    />
  )
}

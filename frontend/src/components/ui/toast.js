import { toast } from 'sonner'

export const notify = {
  success(message, options) {
    return toast.success(message, options)
  },
  error(message, options) {
    return toast.error(message, options)
  },
  warning(message, options) {
    return toast.warning(message, options)
  },
  info(message, options) {
    return toast.info(message, options)
  },
  loading(message, options) {
    return toast.loading(message, options)
  },
  custom(renderer, options) {
    return toast.custom(renderer, options)
  },
  dismiss(id) {
    toast.dismiss(id)
  },
}

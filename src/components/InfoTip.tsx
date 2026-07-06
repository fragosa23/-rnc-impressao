import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * Ícone "i" que revela uma explicação ao passar o cursor ou com o teclado.
 * Serve para que quem não conhece a fábrica perceba o significado de cada dado.
 */
export function InfoTip({ text, label = 'Mais informação' }: { text: string; label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Info className="size-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px] text-center">{text}</TooltipContent>
    </Tooltip>
  )
}

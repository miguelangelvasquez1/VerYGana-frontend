'use client'

import React from 'react'
import { useKeenSlider } from 'keen-slider/react'
import 'keen-slider/keen-slider.min.css'

// Definimos el tipo de cada celular
type Cellphone = {
  id: number
  name: string
  image: string
  date: string
}

// Props que recibirá el componente: un arreglo de celulares
type Props = {
  phones: Cellphone[]
}

/**
 * Plugin personalizado para agregar autoplay al carrusel.
 * Mueve el slider automáticamente cada 3 segundos.
 * Se pausa cuando el mouse está encima.
 */
function AutoplayPlugin(slider: any) {
  let timeout: ReturnType<typeof setTimeout>
  let mouseOver = false

  // Cancela el siguiente paso del autoplay
  function clearNextTimeout() {
    clearTimeout(timeout)
  }

  // Programa el siguiente movimiento automático
  function nextTimeout() {
    clearTimeout(timeout)
    if (mouseOver) return
    timeout = setTimeout(() => {
      slider.next()
    }, 3000) // Tiempo entre slides (3 segundos)
  }

  // Eventos que controlan el autoplay
  slider.on('created', () => {
    // Pausar autoplay cuando el mouse entra
    slider.container.addEventListener('mouseover', () => {
      mouseOver = true
      clearNextTimeout()
    })

    // Reanudar autoplay cuando el mouse sale
    slider.container.addEventListener('mouseout', () => {
      mouseOver = false
      nextTimeout()
    })

    // Iniciar autoplay
    nextTimeout()
  })

  // Detener autoplay cuando el usuario interactúa
  slider.on('dragStarted', clearNextTimeout)

  // Reanudar autoplay después de animaciones
  slider.on('animationEnded', nextTimeout)
  slider.on('updated', nextTimeout)
}

/**
 * Componente principal del carrusel
 * Muestra una lista de celulares para rifar con desplazamiento automático
 */
export default function Carousel({ phones }: Props) {
  // Configuramos el carrusel con loop y el plugin autoplay
  const [sliderRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true, // Permite repetir el carrusel infinitamente
      slides: { perView: 1, spacing: 15 }, // Un slide a la vez, con espacio entre ellos
    },
    [AutoplayPlugin] // Plugin que controla el autoplay
  )

  return (
    <div ref={sliderRef} className="keen-slider w-full max-w-6xl mx-auto">
      {/* Recorremos todos los celulares para generar una slide por cada uno */}
      {phones.map((phone) => (
        <div
          key={phone.id}
          className="keen-slider__slide rounded-xl overflow-hidden shadow-lg bg-white"
        >
          {/* Imagen del celular */}
          <img
            src={phone.image}
            alt={phone.name}
            className="w-full h-[300px] object-contain rounded-t-xl bg-white"
          />

          {/* Información del celular */}
          <div className="p-4">
            <h2 className="text-xl font-bold">{phone.name}</h2>
            <p className="text-sm text-gray-500">Sorteo: {phone.date}</p>
          </div>
        </div>
      ))}
    </div>
  )
}


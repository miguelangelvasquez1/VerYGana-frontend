'use client';

import { FormTextArea } from '../FormFields';

export function GrowthSection() {
  return (
    <>
      <FormTextArea
        name="currentCapacity"
        id="currentCapacity"
        label="Capacidad actual"
        required
        hint="Describe lo que puedes atender hoy. El escenario de crecimiento es solo informativo"
        rows={4}
      />
      <FormTextArea
        name="growthScenario"
        id="growthScenario"
        label="Escenario de crecimiento"
        rows={4}
      />
      <FormTextArea name="growthMeasures" id="growthMeasures" label="Medidas para crecer" rows={4} />
    </>
  );
}

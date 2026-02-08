// components/campaigns/GameConfigForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  Palette, 
  MessageSquare, 
  Award,
  HelpCircle,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { GameConfigDefinition, GameConfigFormData } from '@/types/games/gameConfig';

interface GameConfigFormProps {
  gameTitle: string;
  definitions: GameConfigDefinition[];
  initialData?: GameConfigFormData;
  onSubmit: (data: GameConfigFormData) => void;
  onBack: () => void;
}

export function GameConfigForm({
  gameTitle,
  definitions,
  initialData,
  onSubmit,
  onBack,
}: GameConfigFormProps) {
  const [formData, setFormData] = useState<GameConfigFormData>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar datos del formulario basado en las definiciones
  useEffect(() => {
    if (!initialData) {
      const initial: GameConfigFormData = {};
      definitions.forEach(def => {
        if (def.jsonKey === 'colors' && def.schema) {
          initial.colors = {};
          Object.keys(def.schema).forEach(key => {
            initial.colors![key] = '';
          });
        } else if (def.jsonKey === 'texts' && def.schema) {
          initial.texts = {};
          Object.keys(def.schema).forEach(key => {
            initial.texts![key] = '';
          });
        } else if (def.jsonKey === 'rewards' && def.schema) {
          initial.rewards = {};
          Object.keys(def.schema).forEach(key => {
            initial.rewards![key] = 0;
          });
        } else if (def.jsonKey === 'questions') {
          initial.questions = { questions: [] };
        } else if (def.jsonKey === 'hangman') {
          initial.hangman = { word: '', hint: '', score: 0 };
        }
      });
      setFormData(initial);
    }
  }, [definitions, initialData]);

  const getIconForSection = (jsonKey: string) => {
    switch (jsonKey) {
      case 'colors': return <Palette className="w-5 h-5" />;
      case 'texts': return <MessageSquare className="w-5 h-5" />;
      case 'rewards': return <Award className="w-5 h-5" />;
      case 'questions': return <HelpCircle className="w-5 h-5" />;
      case 'hangman': return <MessageSquare className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    definitions.forEach(def => {
      if (def.required) {
        if (def.jsonKey === 'colors') {
          const colors = formData.colors || {};
          Object.keys(def.schema).forEach(key => {
            if (!colors[key] || colors[key].trim() === '') {
              newErrors[`colors.${key}`] = `${key} es requerido`;
            }
          });
        } else if (def.jsonKey === 'texts') {
          const texts = formData.texts || {};
          Object.keys(def.schema).forEach(key => {
            if (!texts[key] || texts[key].trim() === '') {
              newErrors[`texts.${key}`] = `${key} es requerido`;
            }
          });
        } else if (def.jsonKey === 'questions') {
          const questions = formData.questions?.questions || [];
          if (questions.length === 0) {
            newErrors['questions'] = 'Debes agregar al menos una pregunta';
          }
          questions.forEach((q, idx) => {
            if (!q.question.trim()) {
              newErrors[`questions.${idx}.question`] = 'La pregunta es requerida';
            }
            if (q.answers.length < 2) {
              newErrors[`questions.${idx}.answers`] = 'Debes tener al menos 2 respuestas';
            }
            if (q.correctIndex < 0 || q.correctIndex >= q.answers.length) {
              newErrors[`questions.${idx}.correctIndex`] = 'Índice de respuesta correcta inválido';
            }
          });
        } else if (def.jsonKey === 'hangman') {
          const hangman = formData.hangman;
          if (!hangman?.word || hangman.word.trim() === '') {
            newErrors['hangman.word'] = 'La palabra es requerida';
          }
          if (!hangman?.hint || hangman.hint.trim() === '') {
            newErrors['hangman.hint'] = 'La pista es requerida';
          }
          if (!hangman?.score || hangman.score <= 0) {
            newErrors['hangman.score'] = 'El score debe ser mayor a 0';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Renderizar sección de colores
  const renderColorsSection = (def: GameConfigDefinition) => {
    const colors = formData.colors || {};
    
    return (
      <div className="space-y-4">
        {Object.keys(def.schema).map(colorKey => (
          <div key={colorKey}>
            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
              {colorKey.replace('_', ' ')}
              {def.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={colors[colorKey] || '#000000'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  colors: { ...prev.colors, [colorKey]: e.target.value }
                }))}
                className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={colors[colorKey] || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  colors: { ...prev.colors, [colorKey]: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="#000000"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
              />
            </div>
            {errors[`colors.${colorKey}`] && (
              <p className="mt-1 text-xs text-red-600">{errors[`colors.${colorKey}`]}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Renderizar sección de textos
  const renderTextsSection = (def: GameConfigDefinition) => {
    const texts = formData.texts || {};
    
    return (
      <div className="space-y-4">
        {Object.keys(def.schema).map(textKey => (
          <div key={textKey}>
            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
              {textKey.replace('_', ' ')}
              {def.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={texts[textKey] || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                texts: { ...prev.texts, [textKey]: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={`Ingresa ${textKey.replace('_', ' ')}`}
            />
            {errors[`texts.${textKey}`] && (
              <p className="mt-1 text-xs text-red-600">{errors[`texts.${textKey}`]}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Renderizar sección de recompensas
  const renderRewardsSection = (def: GameConfigDefinition) => {
    const rewards = formData.rewards || {};
    
    return (
      <div className="space-y-4">
        {Object.keys(def.schema).map(rewardKey => (
          <div key={rewardKey}>
            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
              {rewardKey.replace('_', ' ')}
              {def.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={rewards[rewardKey] || 0}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                rewards: { ...prev.rewards, [rewardKey]: Number(e.target.value) }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              min="0"
            />
            {errors[`rewards.${rewardKey}`] && (
              <p className="mt-1 text-xs text-red-600">{errors[`rewards.${rewardKey}`]}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Renderizar sección de preguntas
  const renderQuestionsSection = (def: GameConfigDefinition) => {
    const questions = formData.questions?.questions || [];

    const addQuestion = () => {
      setFormData(prev => ({
        ...prev,
        questions: {
          questions: [
            ...(prev.questions?.questions || []),
            { question: '', answers: ['', ''], correctIndex: 0 }
          ]
        }
      }));
    };

    const removeQuestion = (index: number) => {
      setFormData(prev => ({
        ...prev,
        questions: {
          questions: prev.questions!.questions.filter((_, i) => i !== index)
        }
      }));
    };

    const updateQuestion = (index: number, field: string, value: any) => {
      setFormData(prev => {
        const updated = [...prev.questions!.questions];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, questions: { questions: updated } };
      });
    };

    const addAnswer = (questionIndex: number) => {
      setFormData(prev => {
        const updated = [...prev.questions!.questions];
        updated[questionIndex].answers.push('');
        return { ...prev, questions: { questions: updated } };
      });
    };

    const removeAnswer = (questionIndex: number, answerIndex: number) => {
      setFormData(prev => {
        const updated = [...prev.questions!.questions];
        updated[questionIndex].answers.splice(answerIndex, 1);
        return { ...prev, questions: { questions: updated } };
      });
    };

    const updateAnswer = (questionIndex: number, answerIndex: number, value: string) => {
      setFormData(prev => {
        const updated = [...prev.questions!.questions];
        updated[questionIndex].answers[answerIndex] = value;
        return { ...prev, questions: { questions: updated } };
      });
    };

    return (
      <div className="space-y-6">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Pregunta {qIdx + 1}</h4>
              <button
                type="button"
                onClick={() => removeQuestion(qIdx)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pregunta *
                </label>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="¿Cuál es...?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Respuestas (mínimo 2)
                </label>
                {q.answers.map((answer, aIdx) => (
                  <div key={aIdx} className="flex items-center space-x-2 mb-2">
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={q.correctIndex === aIdx}
                      onChange={() => updateQuestion(qIdx, 'correctIndex', aIdx)}
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => updateAnswer(qIdx, aIdx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={`Respuesta ${aIdx + 1}`}
                    />
                    {q.answers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeAnswer(qIdx, aIdx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addAnswer(qIdx)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar respuesta
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Agregar pregunta
        </button>

        {errors['questions'] && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors['questions']}
          </p>
        )}
      </div>
    );
  };

  // Renderizar sección de ahorcado
  const renderHangmanSection = (def: GameConfigDefinition) => {
    const hangman = formData.hangman || { word: '', hint: '', score: 0 };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Palabra *
          </label>
          <input
            type="text"
            value={hangman.word}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              hangman: { ...prev.hangman!, word: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="JAVASCRIPT"
            pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$"
            maxLength={30}
          />
          {errors['hangman.word'] && (
            <p className="mt-1 text-xs text-red-600">{errors['hangman.word']}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Solo letras y espacios, máximo 30 caracteres</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pista *
          </label>
          <input
            type="text"
            value={hangman.hint}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              hangman: { ...prev.hangman!, hint: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Lenguaje de programación web"
            maxLength={100}
          />
          {errors['hangman.hint'] && (
            <p className="mt-1 text-xs text-red-600">{errors['hangman.hint']}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Máximo 100 caracteres</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Puntuación *
          </label>
          <input
            type="number"
            value={hangman.score}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              hangman: { ...prev.hangman!, score: Number(e.target.value) }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="1"
            max="1000"
          />
          {errors['hangman.score'] && (
            <p className="mt-1 text-xs text-red-600">{errors['hangman.score']}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Entre 1 y 1000 puntos</p>
        </div>
      </div>
    );
  };

  const renderSection = (def: GameConfigDefinition) => {
    switch (def.jsonKey) {
      case 'colors':
        return renderColorsSection(def);
      case 'texts':
        return renderTextsSection(def);
      case 'rewards':
        return renderRewardsSection(def);
      case 'questions':
        return renderQuestionsSection(def);
      case 'hangman':
        return renderHangmanSection(def);
      default:
        return <p className="text-gray-500">Sección no implementada: {def.jsonKey}</p>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Configuración del Juego: {gameTitle}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Personaliza los elementos visuales y de contenido del juego
          </p>
        </div>
      </div>

      {/* Renderizar secciones dinámicamente */}
      {definitions.map(def => (
        <div key={def.jsonKey} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="text-blue-600 mr-3">
              {getIconForSection(def.jsonKey)}
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">
                {def.description}
                {def.required && <span className="text-red-500 ml-2">*</span>}
              </h4>
              {!def.required && (
                <p className="text-xs text-gray-500 mt-1">Opcional</p>
              )}
            </div>
          </div>
          {renderSection(def)}
        </div>
      ))}

      {/* Botones */}
      <div className="flex justify-between pt-4 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </form>
  );
}
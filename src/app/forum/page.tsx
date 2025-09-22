import React from "react";
import { Users, Gift, Award, Eye, Heart } from "lucide-react";
import CharityPost from "@/components/forumComponents/CharityPost";
import Navbar from "@/components/bars/NavBar";
import Footer from "@/components/Footer";
export default function ForumPage() {
    const posts = [
        {
            id: 1,
            title: "Programa de Becas Estudiantiles 2024",
            description: "Gracias a nuestra iniciativa de becas estudiantiles, hemos logrado apoyar a 50 estudiantes de bajos recursos para continuar con sus estudios universitarios. Este programa ha cambiado vidas y abierto nuevas oportunidades de futuro.",
            date: "2024-09-15T10:30:00",
            category: "Educación",
            beneficiaries: 50,
            likes: 234,
            views: 1567,
            amount: 125000,
            winners: ["María González", "Carlos Pérez", "Ana Martínez", "Diego Silva"],
            media: {
                type: "image" as const,
                url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop"
            },
            comments: [
                {
                    author: "Patricia López",
                    text: "Increíble iniciativa! Felicidades a todos los ganadores 🎉",
                    date: "2024-09-15T11:00:00"
                },
                {
                    author: "Roberto Sánchez",
                    text: "Me emociona ver cómo estas becas pueden cambiar el futuro de tantos jóvenes.",
                    date: "2024-09-15T14:20:00"
                },
                {
                    author: "Carmen Ruiz",
                    text: "Ojalá más empresas siguieran este ejemplo de responsabilidad social.",
                    date: "2024-09-15T16:45:00"
                },
                {
                    author: "Luis Mendoza",
                    text: "Como padre de familia, esto me da mucha esperanza para el futuro de nuestros hijos.",
                    date: "2024-09-15T18:30:00"
                }
            ]
        },
        {
            id: 2,
            title: "Donación de Equipos Médicos",
            description: "Hemos hecho entrega de equipos médicos especializados al Hospital Central, beneficiando directamente a más de 1000 pacientes que podrán acceder a tratamientos de mejor calidad. Los equipos incluyen monitores cardíacos, máquinas de diálisis y equipos de diagnóstico por imágenes.",
            date: "2024-09-12T16:45:00",
            category: "Salud",
            beneficiaries: 1000,
            likes: 456,
            views: 2341,
            amount: 250000,
            winners: ["Hospital Central", "Fundación Salud Para Todos"],
            media: {
                type: "video" as const,
                url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
                thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop"
            },
            comments: [
                {
                    author: "Dr. Elena Ramírez",
                    text: "Como médico del hospital, puedo confirmar el impacto positivo de esta donación. ¡Gracias!",
                    date: "2024-09-12T18:30:00"
                },
                {
                    author: "Enfermera Sofía Torres",
                    text: "Los nuevos equipos nos permiten brindar atención de primer nivel a nuestros pacientes.",
                    date: "2024-09-13T08:15:00"
                }
            ]
        },
        {
            id: 3,
            title: "Construcción de Parque Infantil",
            description: "Inauguramos un nuevo parque infantil en la comunidad de San José, brindando un espacio seguro de recreación para más de 300 niños de la zona. El parque cuenta con juegos modernos, áreas verdes y medidas de seguridad que garantizan diversión y tranquilidad para las familias.",
            date: "2024-09-10T09:15:00",
            category: "Comunidad",
            beneficiaries: 300,
            likes: 189,
            views: 987,
            amount: 75000,
            winners: ["Comunidad San José", "Escuela Primaria El Futuro"],
            media: {
                type: "image" as const,
                url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop"
            },
            comments: [
                {
                    author: "María Fernández",
                    text: "¡Qué alegría ver a los niños disfrutar de este hermoso parque!",
                    date: "2024-09-10T15:20:00"
                },
                {
                    author: "Pedro Jiménez",
                    text: "Como vecino de San José, agradezco infinitamente esta obra para nuestros hijos.",
                    date: "2024-09-10T19:45:00"
                },
                {
                    author: "Directora Ana Castro",
                    text: "Los niños de nuestra escuela están encantados con el nuevo parque. ¡Gracias!",
                    date: "2024-09-11T07:30:00"
                }
            ]
        }
    ];

    const totalBeneficiaries = posts.reduce((sum, post) => sum + post.beneficiaries, 0);
    const totalAmount = posts.reduce((sum, post) => sum + (post.amount || 0), 0);
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header con gradiente similar al diseño original */}
            <Navbar/>
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-4">
                            Historias de <span className="text-yellow-300">Impacto</span>
                        </h1>
                        <p className="text-xl text-purple-100 max-w-3xl mx-auto">
                            Conoce las historias de nuestros ganadores y descubre cómo cada contribución
                            transforma vidas y construye un futuro mejor para nuestra comunidad.
                        </p>
                    </div>

                    {/* Estadísticas rápidas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-r from-[#004b8d] via-[#0075c4] to-[#004b8d] rounded-2xl p-6 backdrop-blur-sm shadow-lg">
                            <div className="flex items-center space-x-3 mb-2">
                                <Users className="w-8 h-8 text-yellow-300" />
                                <span className="text-2xl font-bold">{totalBeneficiaries.toLocaleString()}</span>
                            </div>
                            <p className="text-purple-100">Personas Beneficiadas</p>
                        </div>

                        <div className="bg-gradient-to-r from-[#004b8d] via-[#0075c4] to-[#004b8d] rounded-2xl p-6 backdrop-blur-sm shadow-lg">
                            <div className="flex items-center space-x-3 mb-2">
                                <Gift className="w-8 h-8 text-yellow-300" />
                                <span className="text-2xl font-bold">{posts.length}</span>
                            </div>
                            <p className="text-purple-100">Proyectos Completados</p>
                        </div>

                        <div className="bg-gradient-to-r from-[#004b8d] via-[#0075c4] to-[#004b8d] rounded-2xl p-6 backdrop-blur-sm shadow-lg">
                            <div className="flex items-center space-x-3 mb-2">
                                <Award className="w-8 h-8 text-yellow-300" />
                                <span className="text-2xl font-bold">${totalAmount.toLocaleString()}</span>
                            </div>
                            <p className="text-purple-100">Inversión Total</p>
                        </div>

                        <div className="bg-gradient-to-r from[#004b8d] via-[#0075c4] to-[#004b8d] rounded-2xl p-6 backdrop-blur-sm shadow-lg">
                            <div className="flex items-center space-x-3 mb-2">
                                <Eye className="w-8 h-8 text-yellow-300" />
                                <span className="text-2xl font-bold">{totalViews.toLocaleString()}</span>
                            </div>
                            <p className="text-purple-100">Visualizaciones</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Mensaje informativo */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Centro de Historias de Impacto</h3>
                            <p className="text-gray-600">
                                Descubre cómo nuestras iniciativas están transformando vidas en nuestra comunidad.
                                Cada proyecto representa el compromiso de crear un mundo mejor.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lista de publicaciones */}
                <div className="space-y-6">
                    {posts.map(post => (
                        <CharityPost key={post.id} post={post} />
                    ))}
                </div>

                {/* Mensaje al final */}
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">¡Continúa siguiendo nuestro impacto!</h3>
                    <p className="text-gray-500">Estas son nuestras historias más recientes. Mantente conectado para conocer nuevos proyectos.</p>
                </div>
            </div>
            <Footer/>
        </div>
    );
}
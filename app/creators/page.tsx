'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal'; // Using the modified Modal component
import { Creator } from '@/types';

const CreatorsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [currentCreator, setCurrentCreator] = useState<Creator | undefined>(
    undefined
  );
  const [isEditing, setIsEditing] = useState(false);

  // Load creators from local storage on component mount
  useEffect(() => {
    const savedCreators = localStorage.getItem('creators');
    if (savedCreators) {
      try {
        setCreators(JSON.parse(savedCreators));
      } catch (error) {
        console.error('Failed to parse creators from localStorage', error);
      }
    }
  }, []);

  // Save creators to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('creators', JSON.stringify(creators));
  }, [creators]);

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCreator(undefined);
    setIsEditing(false);
  };

  const openAddModal = () => {
    setCurrentCreator(undefined);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (creator: Creator) => {
    setCurrentCreator(creator);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: Creator) => {
    if (isEditing && currentCreator?.id) {
      // Update existing creator
      setCreators((prevCreators) =>
        prevCreators.map((c) =>
          c.id === currentCreator.id ? { ...data, id: currentCreator.id } : c
        )
      );
    } else {
      // Add new creator with a unique ID
      const newCreator = {
        ...data,
        id: Date.now().toString(),
      };
      setCreators((prevCreators) => [...prevCreators, newCreator]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setCreators((prevCreators) =>
      prevCreators.filter((creator) => creator.id !== id)
    );
    closeModal();
  };

  // Function to get the social media icon based on URL
  const getSocialIcon = (url: string) => {
    if (url.includes('instagram.com')) {
      return '📸'; // Instagram
    } else if (url.includes('tiktok.com')) {
      return '🎵'; // TikTok
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return '📹'; // YouTube
    }
    return '🔗'; // Generic link
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Content Creators</h1>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Add Creator
        </button>
      </div>

      {creators.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">
            No creators added yet. Click &apos;Add Creator&apos; to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((creator) => (
            <div
              key={creator.id}
              className="border rounded shadow hover:shadow-md p-4 cursor-pointer"
              onClick={() => openEditModal(creator)}
            >
              <h2 className="text-xl font-semibold mb-2">{creator.name}</h2>
              <p className="text-gray-600 mb-2">{creator.location}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {creator.languages.map((language, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
                  >
                    {language}
                  </span>
                ))}
              </div>

              <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                {creator.description}
              </p>

              <div className="flex space-x-2 mt-2">
                <a
                  href={creator.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-pink-600 hover:text-pink-800"
                >
                  {getSocialIcon(creator.instagramUrl)} Instagram
                </a>
                <a
                  href={creator.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-black hover:text-gray-800"
                >
                  {getSocialIcon(creator.tiktokUrl)} TikTok
                </a>
                {creator.youtubeUrl && (
                  <a
                    href={creator.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-red-600 hover:text-red-800"
                  >
                    {getSocialIcon(creator.youtubeUrl)} YouTube
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          formType="creator"
          initialData={currentCreator}
          isEditing={isEditing}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
};

export default CreatorsPage;

import User from "../models/User.js";
import SurveyForm from "../models/SurveyForm.js";
import Category from "../models/Category.js";
import SurveyResponse from "../models/SurveyResponse.js";

const seedCategories = async () => {
  try {
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      console.log("📁 Categories already exist, skipping seed");
      return;
    }

    const categories = [
      {
        name: "Food and Beverages",
        description: "Surveys related to food, drinks, and dining experiences",
        icon: "🍔",
        color: "#FF6B6B",
        sortOrder: 1,
        slug: "food-beverages",
        isActive: true,
      },
      {
        name: "Entertainment",
        description: "Media, movies, music, and entertainment surveys",
        icon: "🎬",
        color: "#4ECDC4",
        sortOrder: 2,
        slug: "entertainment",
        isActive: true,
      },
      {
        name: "Luxury",
        description: "Premium products and luxury lifestyle surveys",
        icon: "💎",
        color: "#45B7D1",
        sortOrder: 3,
        slug: "luxury",
        isActive: true,
      },
      {
        name: "Logistics",
        description: "Transportation and supply chain surveys",
        icon: "🚚",
        color: "#96CEB4",
        sortOrder: 4,
        slug: "logistics",
        isActive: true,
      },
      {
        name: "Vehicles",
        description: "Automotive and transportation surveys",
        icon: "🚗",
        color: "#FECA57",
        sortOrder: 5,
        slug: "vehicles",
        isActive: true,
      },
      {
        name: "NGO's",
        description: "Non-profit and social impact surveys",
        icon: "🤝",
        color: "#FF9FF3",
        sortOrder: 6,
        slug: "ngos",
        isActive: true,
      },
      {
        name: "Retail",
        description: "Shopping and retail experience surveys",
        icon: "🛍️",
        color: "#54A0FF",
        sortOrder: 7,
        slug: "retail",
        isActive: true,
      },
      {
        name: "Education",
        description: "Learning and educational surveys",
        icon: "📚",
        color: "#5F27CD",
        sortOrder: 8,
        slug: "education",
        isActive: true,
      },
      {
        name: "Fashion and Lifestyle",
        description: "Style, fashion, and lifestyle surveys",
        icon: "👗",
        color: "#947DD1",
        sortOrder: 9,
        slug: "fashion-lifestyle",
        isActive: true,
      },
      {
        name: "Technology",
        description: "Software, hardware, and tech innovation surveys",
        icon: "💻",
        color: "#6C5CE7",
        sortOrder: 10,
        slug: "technology",
        isActive: true,
      },
      {
        name: "Marketing",
        description: "Brand awareness and marketing campaign surveys",
        icon: "📈",
        color: "#FD79A8",
        sortOrder: 11,
        slug: "marketing",
        isActive: true,
      },
      {
        name: "HR",
        description: "Human resources and workplace surveys",
        icon: "👥",
        color: "#00B894",
        sortOrder: 12,
        slug: "hr",
        isActive: true,
      },
      {
        name: "Others",
        description: "Miscellaneous surveys that don't fit other categories",
        icon: "📝",
        color: "#636E72",
        sortOrder: 13,
        slug: "others",
        isActive: true,
      },
    ];

    await Category.insertMany(categories);
    console.log("✅ Categories seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  }
};

const seedUsers = async () => {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log("👥 Users already exist, skipping seed");
      return;
    }

    const users = [
      {
        name: "Sudhansu Kumar",
        email: "sudhansu@youthtalks.com",
        password: "password123",
        role: "admin",
        isActive: true,
        isEmailVerified: true,
        preferences: {
          emailNotifications: true,
          marketingEmails: false,
          theme: "light",
          language: "en",
        },
      },
      {
        name: "Demo User",
        email: "demo@youthtalks.com",
        password: "password123",
        role: "user",
        isActive: true,
        isEmailVerified: true,
        preferences: {
          emailNotifications: true,
          marketingEmails: true,
          theme: "light",
          language: "en",
        },
      },
      {
        name: "John Smith",
        email: "john.smith@example.com",
        password: "password123",
        role: "user",
        isActive: true,
        isEmailVerified: true,
        preferences: {
          emailNotifications: false,
          marketingEmails: false,
          theme: "dark",
          language: "en",
        },
      },
    ];

    await User.insertMany(users);
    console.log("✅ Users seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding users:", error);
  }
};

const seedForms = async () => {
  try {
    const existingForms = await SurveyForm.countDocuments();
    if (existingForms > 0) {
      console.log("📋 Forms already exist, skipping seed");
      return;
    }

    const admin = await User.findOne({ role: "admin" });
    const regularUser = await User.findOne({ role: "user", email: "demo@youthtalks.com" });

    if (!admin) {
      console.log("⚠️ No admin user found, skipping forms seeding");
      return;
    }

    const forms = [
      {
        title: "Customer Satisfaction Survey 2025",
        description: "Comprehensive feedback collection for our latest product launch and service improvements",
        headerImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800",
        author: admin.name,
        authorId: admin._id,
        headline: "Help us serve you better with your valuable feedback",
        category: "Retail",
        tags: ["customer", "satisfaction", "feedback", "service", "improvement"],
        publishDate: new Date("2025-01-15T09:00:00Z"),
        expiryDate: new Date("2025-03-15T18:00:00Z"),
        status: "published",
        submissionCount: 156,
        viewCount: 1240,
        isActive: true,
        metaTitle: "Customer Satisfaction Survey - Help Us Improve",
        metaDescription: "Share your experience and help us provide better service through our comprehensive customer satisfaction survey.",
        settings: {
          allowMultipleSubmissions: false,
          requireEmailVerification: false,
          showProgressBar: true,
          shuffleQuestions: false,
          confirmationMessage: "Thank you for your valuable feedback! We appreciate your time and will use your insights to improve our services.",
          emailNotifications: true,
          generateReports: true,
          collectEmail: true,
          collectName: true,
          isPublic: true,
        },
        questions: [
          {
            id: "q1",
            type: "rating",
            title: "How satisfied are you with our overall service?",
            description: "Please rate your overall satisfaction on a scale of 1-5",
            isRequired: true,
            maxRating: 5,
          },
          {
            id: "q2",
            type: "multiple-choice",
            title: "How did you hear about us?",
            description: "Select the primary source through which you discovered our services",
            isRequired: true,
            options: [
              { id: "opt1", text: "Social Media" },
              { id: "opt2", text: "Word of Mouth" },
              { id: "opt3", text: "Online Advertisement" },
              { id: "opt4", text: "Search Engine" },
              { id: "opt5", text: "Other" },
            ],
          },
          {
            id: "q3",
            type: "paragraph",
            title: "What improvements would you suggest?",
            description: "Please provide detailed feedback on areas we can improve",
            isRequired: false,
            validation: {
              maxLength: 500,
            },
          },
          {
            id: "q4",
            type: "checkbox",
            title: "Which services have you used? (Select all that apply)",
            description: "Help us understand which of our services you've experienced",
            isRequired: true,
            options: [
              { id: "opt1", text: "Online Support" },
              { id: "opt2", text: "Phone Support" },
              { id: "opt3", text: "Email Support" },
              { id: "opt4", text: "Live Chat" },
              { id: "opt5", text: "In-person Support" },
            ],
          },
          {
            id: "q5",
            type: "email",
            title: "Your email address (for follow-up)",
            description: "We may contact you for additional feedback or to address any concerns",
            isRequired: false,
          },
        ],
        averageCompletionTime: 4.5,
        completionRate: 78,
      },
      {
        title: "Product Feature Feedback Survey",
        description: "Help us prioritize new features and improvements for our upcoming product releases",
        headerImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
        author: admin.name,
        authorId: admin._id,
        headline: "Shape the future of our products with your input",
        category: "Technology",
        tags: ["product", "feedback", "features", "development", "roadmap"],
        publishDate: new Date("2025-02-01T10:00:00Z"),
        expiryDate: new Date("2025-04-01T17:00:00Z"),
        status: "scheduled",
        submissionCount: 0,
        viewCount: 45,
        isActive: true,
        metaTitle: "Product Feature Feedback - Shape Our Roadmap",
        metaDescription: "Share your thoughts on new features and help us build products that better serve your needs.",
        settings: {
          allowMultipleSubmissions: false,
          requireEmailVerification: true,
          showProgressBar: true,
          shuffleQuestions: false,
          confirmationMessage: "Thank you for helping shape our product roadmap! Your feedback is invaluable.",
          emailNotifications: true,
          generateReports: true,
          collectEmail: true,
          collectName: true,
          isPublic: true,
        },
        questions: [
          {
            id: "q1",
            type: "checkbox",
            title: "Which features do you use most frequently?",
            description: "Select all features you use on a regular basis",
            isRequired: true,
            options: [
              { id: "opt1", text: "Dashboard Analytics" },
              { id: "opt2", text: "Custom Reports" },
              { id: "opt3", text: "Data Export" },
              { id: "opt4", text: "Team Collaboration" },
              { id: "opt5", text: "Mobile App" },
              { id: "opt6", text: "API Integration" },
            ],
          },
          {
            id: "q2",
            type: "rating",
            title: "How would you rate the ease of use of our interface?",
            description: "Consider navigation, layout, and overall user experience",
            isRequired: true,
            maxRating: 10,
          },
          {
            id: "q3",
            type: "dropdown",
            title: "What is your primary use case?",
            description: "Help us understand how you primarily use our product",
            isRequired: true,
            options: [
              { id: "opt1", text: "Business Analytics" },
              { id: "opt2", text: "Personal Projects" },
              { id: "opt3", text: "Educational Research" },
              { id: "opt4", text: "Marketing Campaigns" },
              { id: "opt5", text: "Customer Research" },
            ],
          },
          {
            id: "q4",
            type: "number",
            title: "How many team members typically use your account?",
            description: "Enter the approximate number of users",
            isRequired: false,
            validation: {
              minValue: 1,
              maxValue: 1000,
            },
          },
        ],
        averageCompletionTime: 3.2,
        completionRate: 0,
      },
    ];

    await SurveyForm.insertMany(forms);
    console.log("✅ Forms seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding forms:", error);
  }
};

const seedDatabase = async () => {
  console.log("🌱 Starting database seeding...");

  await seedCategories();
  await seedUsers();
  await seedForms();

  console.log("🎉 Database seeding completed!");
};

export default seedDatabase;

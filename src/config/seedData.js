import User from "../models/User.js";
import Form from "../models/Form.js";
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
      },
      {
        name: "Entertainment",
        description: "Media, movies, music, and entertainment surveys",
        icon: "🎬",
        color: "#4ECDC4",
        sortOrder: 2,
      },
      {
        name: "Luxury",
        description: "Premium products and luxury lifestyle surveys",
        icon: "💎",
        color: "#45B7D1",
        sortOrder: 3,
      },
      {
        name: "Logistics",
        description: "Transportation and supply chain surveys",
        icon: "🚚",
        color: "#96CEB4",
        sortOrder: 4,
      },
      {
        name: "Vehicles",
        description: "Automotive and transportation surveys",
        icon: "🚗",
        color: "#FECA57",
        sortOrder: 5,
      },
      {
        name: "NGO's",
        description: "Non-profit and social impact surveys",
        icon: "🤝",
        color: "#FF9FF3",
        sortOrder: 6,
      },
      {
        name: "Retail",
        description: "Shopping and retail experience surveys",
        icon: "🛍️",
        color: "#54A0FF",
        sortOrder: 7,
      },
      {
        name: "Education",
        description: "Learning and educational surveys",
        icon: "📚",
        color: "#5F27CD",
        sortOrder: 8,
      },
      {
        name: "Fashion and Lifestyle",
        description: "Style, fashion, and lifestyle surveys",
        icon: "👗",
        color: "#947DD1",
        sortOrder: 9,
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
      },
      {
        name: "Demo User",
        email: "demo@youthtalks.com",
        password: "password123",
        role: "user",
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
    const existingForms = await Form.countDocuments();
    if (existingForms > 0) {
      console.log("📋 Forms already exist, skipping seed");
      return;
    }

    const admin = await User.findOne({ role: "admin" });

    const forms = [
      {
        title: "Customer Satisfaction Survey",
        description:
          "Comprehensive feedback collection for our latest product launch",
        author: "Sudhansu Kumar",
        authorId: admin?._id,
        headline: "Help us improve our service",
        category: "Retail",
        tags: ["customer", "satisfaction", "feedback"],
        startDate: new Date("2024-01-15T09:00:00Z"),
        endDate: new Date("2024-02-15T18:00:00Z"),
        status: "live",
        responseCount: 156,
        viewCount: 1240,
        questions: [
          {
            id: "q1",
            type: "rating",
            title: "How satisfied are you with our service?",
            description: "Rate your overall satisfaction",
            required: true,
            maxRating: 5,
          },
          {
            id: "q2",
            type: "mcq",
            title: "How did you hear about us?",
            required: true,
            options: [
              { id: "opt1", text: "Social Media" },
              { id: "opt2", text: "Word of Mouth" },
              { id: "opt3", text: "Advertisement" },
              { id: "opt4", text: "Other" },
            ],
          },
          {
            id: "q3",
            type: "long",
            title: "What improvements would you suggest?",
            description: "Please provide detailed feedback",
            required: false,
          },
        ],
      },
      {
        title: "Product Feedback Form",
        description: "Quarterly customer satisfaction and loyalty assessment",
        author: "Sudhansu Kumar",
        authorId: admin?._id,
        headline: "Share your thoughts on our products",
        category: "Technology",
        tags: ["product", "feedback", "development"],
        startDate: new Date("2024-01-25T10:00:00Z"),
        endDate: new Date("2024-02-25T17:00:00Z"),
        status: "upcoming",
        responseCount: 0,
        viewCount: 45,
        questions: [
          {
            id: "q1",
            type: "checkbox",
            title: "Which features do you use most?",
            required: true,
            options: [
              { id: "opt1", text: "Dashboard" },
              { id: "opt2", text: "Reports" },
              { id: "opt3", text: "Analytics" },
              { id: "opt4", text: "Export" },
            ],
          },
        ],
      },
      {
        title: "Brand Awareness Campaign Survey",
        description: "Measuring brand recognition and market positioning",
        author: "Sudhansu Kumar",
        authorId: admin?._id,
        headline: "How well do you know our brand?",
        category: "Marketing",
        tags: ["brand", "awareness", "marketing"],
        startDate: new Date("2023-12-01T08:00:00Z"),
        endDate: new Date("2024-01-05T20:00:00Z"),
        status: "closed",
        responseCount: 892,
        viewCount: 3420,
        questions: [],
      },
      {
        title: "Employee Wellness Check",
        description: "Internal survey for employee satisfaction and wellbeing",
        author: "Sudhansu Kumar",
        authorId: admin?._id,
        headline: "Tell us about your workplace experience",
        category: "HR",
        tags: ["wellness", "internal", "hr"],
        startDate: new Date("2024-01-30T09:00:00Z"),
        endDate: new Date("2024-02-28T17:00:00Z"),
        status: "draft",
        responseCount: 0,
        viewCount: 12,
        questions: [],
      },
    ];

    await Form.insertMany(forms);
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

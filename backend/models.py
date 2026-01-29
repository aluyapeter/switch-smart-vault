from sqlalchemy import Column, Integer, String, Boolean, BigInteger, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    address = Column(String(42), unique=True, index=True, nullable=False)
    nonce = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    locks = relationship("Lock", back_populates="owner")

class Lock(Base):
    __tablename__ = "locks"

    id = Column(Integer, primary_key=True, index=True) 
    
    amount = Column(Numeric(78, 0), nullable=False)
    
    unlock_timestamp = Column(BigInteger, nullable=False)
    created_at = Column(BigInteger, nullable=False)
    
    goal_name = Column(String(64), nullable=True)
    withdrawn = Column(Boolean, default=False)
    
    owner_address = Column(String(42), ForeignKey("users.address"), nullable=False)
    tx_hash = Column(String(66), nullable=False)

    owner = relationship("User", back_populates="locks")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    lock_id = Column(Integer, ForeignKey("locks.id"), nullable=False)
    email = Column(String(255), nullable=False)
    notify_before_seconds = Column(Integer, default=86400)
    sent = Column(Boolean, default=False)
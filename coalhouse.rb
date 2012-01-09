require 'rubygems'
require 'sinatra'
require 'data_mapper'
require 'haml'
require 'sass'

DataMapper.setup(:default, ENV['DATABASE_URL'] || "sqlite://#{Dir.pwd}/coalhouse.db")

class Attending
  include DataMapper::Resource
  property :id,     Serial
  property :name,   Text
  property :timestamp, DateTime
end

DataMapper.auto_upgrade!

class Coalhouse < Sinatra::Application
  get '/' do
    t = Date.today
    stale = Attending.all(:timestamp.lt => DateTime.new(t.year, t.month, t.day))
    stale.each { |a| a.destroy }
   
    @attending = Attending.all
    haml :coalhouse
  end

  post '/add' do
    name = params[:name]
    name = 'Lazy Mystery Guest' if name.length == 0
    time = DateTime.zone.now

    Attending.create(:name => name, :timestamp => time)

    #flash[:notice] = "Added #{name}"
    redirect '/', 303
  end

  post '/delete' do
    id = params[:id]

    victim = Attending.get(id)
    victim.destroy
   
    #flash[:notice] = "Removed #{victim.name}"
    redirect '/', 303
  end
end
